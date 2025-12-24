FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod ./
RUN go mod download

COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker .

FROM alpine:latest

RUN apk --no-cache add ca-certificates dumb-init

WORKDIR /root/

COPY --from=builder /app/worker .
RUN chmod +x worker

ENTRYPOINT ["dumb-init", "--"]
CMD ["./worker"]


