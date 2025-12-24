#!/usr/bin/env python3
"""
Backfill Tool

Backfills missing or corrupted transaction data.
"""

import os
import sys
import click
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        database=os.getenv('POSTGRES_DB', 'paysignal'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres')
    )

@click.command()
@click.option('--start-date', required=True, help='Start date (YYYY-MM-DD)')
@click.option('--end-date', required=True, help='End date (YYYY-MM-DD)')
@click.option('--batch-size', default=100, help='Batch size for processing')
@click.option('--dry-run', is_flag=True, help='Simulate without making changes')
def backfill(start_date, end_date, batch_size, dry_run):
    """Backfill missing transaction data."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    click.echo(f"Backfilling transactions from {start_date} to {end_date}")
    
    # Find transactions missing audit logs
    query = """
        SELECT DISTINCT pt.payment_transaction_id, pt.merchant_id, pt.amount,
               pt.currency, pt.current_state, pt.created_at
        FROM payment_transactions pt
        LEFT JOIN audit_logs al ON pt.payment_transaction_id = al.payment_transaction_id
        WHERE pt.created_at >= %s AND pt.created_at <= %s
        AND al.audit_log_id IS NULL
        ORDER BY pt.created_at
    """
    
    cursor.execute(query, (start, end))
    transactions = cursor.fetchall()
    
    click.echo(f"Found {len(transactions)} transactions missing audit logs")
    
    if dry_run:
        click.echo("DRY RUN MODE - No changes will be made")
        for txn in transactions[:10]:  # Show first 10
            click.echo(f"  Would backfill: {txn['payment_transaction_id']}")
        return
    
    # Create initial audit log entries
    inserted = 0
    for i, txn in enumerate(transactions, 1):
        try:
            cursor.execute("""
                INSERT INTO audit_logs (
                    payment_transaction_id, event_id, event_type,
                    new_state, timestamp, source_service
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                txn['payment_transaction_id'],
                f"EVT-BACKFILL-{txn['payment_transaction_id']}",
                'payment_initiated',
                txn['current_state'],
                txn['created_at'],
                'backfill-tool'
            ))
            inserted += 1
            
            if i % batch_size == 0:
                conn.commit()
                click.echo(f"Processed {i}/{len(transactions)} transactions")
        except Exception as e:
            click.echo(f"Error processing {txn['payment_transaction_id']}: {e}", err=True)
            conn.rollback()
    
    conn.commit()
    click.echo(f"Backfill completed! Inserted {inserted} audit log entries")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    backfill()





