package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/go-redis/redis/v8"
	_ "github.com/lib/pq"
	"github.com/sirupsen/logrus"
)

const (
	workerPoolSize    = 10
	maxRetries        = 15
	baseBackoff       = time.Second
	maxBackoff        = 5 * time.Minute
	visibilityTimeout = 30 * time.Second
)

type PaymentEvent struct {
	EventID            string                 `json:"event_id"`
	TransactionID      string                 `json:"payment_transaction_id"`
	MerchantID         string                 `json:"merchant_id"`
	EventType          string                 `json:"event_type"`
	PreviousState      string                 `json:"previous_state,omitempty"`
	NewState           string                 `json:"new_state"`
	Amount             int64                  `json:"amount"`
	Currency           string                 `json:"currency"`
	Timestamp          string                 `json:"timestamp"`
	SourceService      string                 `json:"source_service"`
	CorrelationID      string                 `json:"correlation_id,omitempty"`
	Metadata           map[string]interface{} `json:"metadata,omitempty"`
	RetryCount         int                    `json:"retry_count,omitempty"`
}

type Worker struct {
	id       int
	db       *sql.DB
	redis    *redis.Client
	sqs      *sqs.SQS
	queueURL string
	dlqURL   string
	logger   *logrus.Logger
	ctx      context.Context
	cancel   context.CancelFunc
}

func main() {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	// Database connection
	db, err := sql.Open("postgres", getPostgresDSN())
	if err != nil {
		logger.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		logger.Fatalf("Failed to ping PostgreSQL: %v", err)
	}

	// Redis connection
	redisURL := getEnv("REDIS_URL", "localhost:6379")
	// Remove redis:// prefix if present
	if strings.HasPrefix(redisURL, "redis://") {
		redisURL = strings.TrimPrefix(redisURL, "redis://")
	}
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisURL,
		Password: "",
		DB:       0,
	})
	defer rdb.Close()

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		logger.Fatalf("Failed to connect to Redis: %v", err)
	}

	// AWS SQS session
	awsConfig := &aws.Config{
		Region: aws.String(getEnv("AWS_REGION", "us-east-1")),
	}
	
	// Set credentials if provided
	accessKeyID := getEnv("AWS_ACCESS_KEY_ID", "")
	secretAccessKey := getEnv("AWS_SECRET_ACCESS_KEY", "")
	if accessKeyID != "" && secretAccessKey != "" {
		awsConfig.Credentials = credentials.NewStaticCredentials(accessKeyID, secretAccessKey, "")
	}
	
	sess, err := session.NewSession(awsConfig)
	if err != nil {
		logger.Fatalf("Failed to create AWS session: %v", err)
	}

	sqsClient := sqs.New(sess)
	queueURL := getEnv("SQS_QUEUE_URL", "")
	dlqURL := getEnv("SQS_DLQ_URL", "")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start worker pool
	var wg sync.WaitGroup
	workers := make([]*Worker, workerPoolSize)

	for i := 0; i < workerPoolSize; i++ {
		worker := &Worker{
			id:       i + 1,
			db:       db,
			redis:    rdb,
			sqs:      sqsClient,
			queueURL: queueURL,
			dlqURL:   dlqURL,
			logger:   logger,
			ctx:      ctx,
			cancel:   cancel,
		}
		workers[i] = worker
		wg.Add(1)
		go func(w *Worker) {
			defer wg.Done()
			w.Start()
		}(worker)
	}

	logger.Info("Go worker service started", "pool_size", workerPoolSize)

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	logger.Info("Shutting down workers...")
	cancel()
	wg.Wait()
	logger.Info("All workers stopped")
}

func (w *Worker) Start() {
	for {
		select {
		case <-w.ctx.Done():
			return
		default:
			w.processMessage()
		}
	}
}

func (w *Worker) processMessage() {
	result, err := w.sqs.ReceiveMessageWithContext(w.ctx, &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(w.queueURL),
		MaxNumberOfMessages: aws.Int64(1),
		VisibilityTimeout:   aws.Int64(int64(visibilityTimeout.Seconds())),
		WaitTimeSeconds:     aws.Int64(20), // Long polling
	})

	if err != nil {
		w.logger.WithError(err).Error("Failed to receive message from SQS")
		time.Sleep(time.Second)
		return
	}

	if len(result.Messages) == 0 {
		return
	}

	msg := result.Messages[0]
	var event PaymentEvent

	if err := json.Unmarshal([]byte(*msg.Body), &event); err != nil {
		w.logger.WithError(err).Error("Failed to parse message")
		w.deleteMessage(msg.ReceiptHandle)
		return
	}

	// Check idempotency
	if w.isDuplicate(event.EventID) {
		w.logger.WithField("event_id", event.EventID).Warn("Duplicate event detected, skipping")
		w.deleteMessage(msg.ReceiptHandle)
		return
	}

	// Process with retry logic
	success := w.processWithRetry(&event, msg.ReceiptHandle)

	if success {
		// Mark as processed in Redis (idempotency)
		w.markProcessed(event.EventID)
		w.deleteMessage(msg.ReceiptHandle)
	} else {
		// Move to DLQ after max retries
		w.moveToDLQ(msg)
	}
}

func (w *Worker) processWithRetry(event *PaymentEvent, receiptHandle *string) bool {
	for attempt := 0; attempt < maxRetries; attempt++ {
		if w.processEvent(event) {
			return true
		}

		backoff := calculateBackoff(attempt)
		w.logger.WithFields(logrus.Fields{
			"event_id": event.EventID,
			"attempt":  attempt + 1,
			"backoff":  backoff,
		}).Warn("Processing failed, retrying")

		// Extend visibility timeout
		w.extendVisibilityTimeout(receiptHandle, backoff)

		select {
		case <-time.After(backoff):
		case <-w.ctx.Done():
			return false
		}
	}

	return false
}

func (w *Worker) processEvent(event *PaymentEvent) bool {
	// 1. Validate state transitions and business rules
	if !w.evaluateRules(event) {
		return false
	}

	// 2. Update transaction state in database
	tx, err := w.db.Begin()
	if err != nil {
		w.logger.WithError(err).Error("Failed to begin transaction")
		return false
	}
	defer tx.Rollback()

	// Update transaction
	_, err = tx.Exec(`
		UPDATE payment_transactions 
		SET current_state = $1, 
		    last_event_id = $2, 
		    updated_at = NOW(),
		    retry_count = $3
		WHERE payment_transaction_id = $4
	`, event.NewState, event.EventID, event.RetryCount, event.TransactionID)

	if err != nil {
		w.logger.WithError(err).Error("Failed to update transaction")
		return false
	}

	// Insert audit log
	_, err = tx.Exec(`
		INSERT INTO audit_logs (
			payment_transaction_id, event_id, event_type,
			previous_state, new_state, timestamp, source_service,
			correlation_id, metadata
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, event.TransactionID, event.EventID, event.EventType,
		event.PreviousState, event.NewState, event.Timestamp,
		event.SourceService, event.CorrelationID, event.Metadata)

	if err != nil {
		w.logger.WithError(err).Error("Failed to insert audit log")
		return false
	}

	if err := tx.Commit(); err != nil {
		w.logger.WithError(err).Error("Failed to commit transaction")
		return false
	}

	w.logger.WithField("event_id", event.EventID).Info("Event processed successfully")
	return true
}

func (w *Worker) evaluateRules(event *PaymentEvent) bool {
	// Validate state transitions
	validTransitions := map[string][]string{
		"pending":    {"processing", "cancelled"},
		"processing": {"completed", "failed"},
		"completed":  {},
		"failed":     {"processing"},
		"cancelled":  {},
		"refunded":   {},
		"disputed":   {},
	}

	allowedStates, exists := validTransitions[event.PreviousState]
	if !exists {
		w.logger.WithField("previous_state", event.PreviousState).Warn("Unknown previous state")
		return false
	}

	valid := false
	for _, state := range allowedStates {
		if state == event.NewState {
			valid = true
			break
		}
	}

	if !valid {
		w.logger.WithFields(logrus.Fields{
			"previous_state": event.PreviousState,
			"new_state":      event.NewState,
		}).Warn("Invalid state transition")
		return false
	}

	// Validate amount is positive
	if event.Amount <= 0 {
		w.logger.WithField("amount", event.Amount).Warn("Invalid amount")
		return false
	}

	return true
}

func (w *Worker) isDuplicate(eventID string) bool {
	key := fmt.Sprintf("processed:%s", eventID)
	exists, _ := w.redis.Exists(w.ctx, key).Result()
	return exists > 0
}

func (w *Worker) markProcessed(eventID string) {
	key := fmt.Sprintf("processed:%s", eventID)
	w.redis.Set(w.ctx, key, "1", 24*time.Hour)
}

func (w *Worker) deleteMessage(receiptHandle *string) {
	_, err := w.sqs.DeleteMessage(&sqs.DeleteMessageInput{
		QueueUrl:      aws.String(w.queueURL),
		ReceiptHandle: receiptHandle,
	})
	if err != nil {
		w.logger.WithError(err).Error("Failed to delete message")
	}
}

func (w *Worker) extendVisibilityTimeout(receiptHandle *string, duration time.Duration) {
	_, err := w.sqs.ChangeMessageVisibility(&sqs.ChangeMessageVisibilityInput{
		QueueUrl:          aws.String(w.queueURL),
		ReceiptHandle:     receiptHandle,
		VisibilityTimeout: aws.Int64(int64(duration.Seconds())),
	})
	if err != nil {
		w.logger.WithError(err).Error("Failed to extend visibility timeout")
	}
}

func (w *Worker) moveToDLQ(msg *sqs.Message) {
	_, err := w.sqs.SendMessage(&sqs.SendMessageInput{
		QueueUrl:    aws.String(w.dlqURL),
		MessageBody: msg.Body,
	})
	if err != nil {
		w.logger.WithError(err).Error("Failed to move message to DLQ")
		return
	}
	w.deleteMessage(msg.ReceiptHandle)
}

func calculateBackoff(attempt int) time.Duration {
	backoff := baseBackoff * time.Duration(1<<uint(attempt))
	if backoff > maxBackoff {
		backoff = maxBackoff
	}
	return backoff
}

func getPostgresDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("POSTGRES_HOST", "localhost"),
		getEnv("POSTGRES_PORT", "5432"),
		getEnv("POSTGRES_USER", "postgres"),
		getEnv("POSTGRES_PASSWORD", "postgres"),
		getEnv("POSTGRES_DB", "paysignal"),
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}





