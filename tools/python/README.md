# PaySignal Python Tools

Collection of analysis, testing, and automation tools.

## Tools

### replay.py
Replays historical payment events from audit logs.

```bash
python replay.py --start-date 2024-01-01 --end-date 2024-01-31 --limit 1000
```

### backfill.py
Backfills missing or corrupted transaction data.

```bash
python backfill.py --start-date 2024-01-01 --end-date 2024-01-31
```

### load_test.py
Load testing tool using Locust.

```bash
python load_test.py run --host http://localhost:8080 --users 50 --duration 300
```

### chaos_test.py
Chaos engineering tool for resilience testing.

```bash
python chaos_test.py corrupt-transactions --transactions 100
```

### analyze.py
Offline analysis of payment transaction data.

```bash
python analyze.py --start-date 2024-01-01 --end-date 2024-01-31 --output report.json
```

## Installation

```bash
pip install -r requirements.txt
```

## Environment Variables

Set these in `.env`:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=paysignal
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
AWS_REGION=us-east-1
```





