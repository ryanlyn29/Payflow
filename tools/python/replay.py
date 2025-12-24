#!/usr/bin/env python3
"""
Payment Event Replay Tool

Replays historical payment events from audit logs for testing and debugging.
"""

import os
import sys
import time
import json
import click
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv

load_dotenv()

SQS_QUEUE_URL = os.getenv('SQS_QUEUE_URL', '')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8080')

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        database=os.getenv('POSTGRES_DB', 'paysignal'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres')
    )

def fetch_audit_logs(transaction_id=None, start_date=None, end_date=None, limit=1000):
    """Fetch audit logs from database."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = "SELECT * FROM audit_logs WHERE 1=1"
    params = []
    
    if transaction_id:
        query += " AND payment_transaction_id = %s"
        params.append(transaction_id)
    
    if start_date:
        query += " AND timestamp >= %s"
        params.append(start_date)
    
    if end_date:
        query += " AND timestamp <= %s"
        params.append(end_date)
    
    query += " ORDER BY timestamp ASC LIMIT %s"
    params.append(limit)
    
    cursor.execute(query, params)
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return logs

def send_to_queue(event_data, queue_url):
    """Send event to SQS queue."""
    import boto3
    sqs = boto3.client('sqs', region_name=os.getenv('AWS_REGION', 'us-east-1'))
    
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(event_data)
    )
    return response['MessageId']

@click.command()
@click.option('--transaction-id', help='Replay events for specific transaction')
@click.option('--start-date', help='Start date (YYYY-MM-DD)')
@click.option('--end-date', help='End date (YYYY-MM-DD)')
@click.option('--limit', default=1000, help='Maximum number of events to replay')
@click.option('--queue-url', default=SQS_QUEUE_URL, help='SQS queue URL')
@click.option('--dry-run', is_flag=True, help='Simulate without sending to queue')
@click.option('--delay', default=0.1, help='Delay between events (seconds)')
def replay(transaction_id, start_date, end_date, limit, queue_url, dry_run, delay):
    """Replay payment events from audit logs."""
    click.echo(f"Fetching audit logs...")
    
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    logs = fetch_audit_logs(transaction_id, start, end, limit)
    
    if not logs:
        click.echo("No events found to replay.")
        return
    
    click.echo(f"Found {len(logs)} events to replay")
    
    if dry_run:
        click.echo("DRY RUN MODE - No events will be sent")
    
    for i, log in enumerate(logs, 1):
        event_data = {
            'event_id': log['event_id'],
            'payment_transaction_id': log['payment_transaction_id'],
            'event_type': log['event_type'],
            'previous_state': log.get('previous_state'),
            'new_state': log['new_state'],
            'timestamp': log['timestamp'].isoformat(),
            'source_service': log['source_service'],
            'correlation_id': log.get('correlation_id'),
            'metadata': log.get('metadata', {})
        }
        
        if dry_run:
            click.echo(f"[{i}/{len(logs)}] Would send: {log['event_id']}")
        else:
            try:
                msg_id = send_to_queue(event_data, queue_url)
                click.echo(f"[{i}/{len(logs)}] Sent {log['event_id']} -> {msg_id}")
            except Exception as e:
                click.echo(f"Error sending {log['event_id']}: {e}", err=True)
        
        if delay > 0:
            time.sleep(delay)
    
    click.echo("Replay completed!")

if __name__ == '__main__':
    replay()





