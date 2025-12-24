#!/usr/bin/env python3
"""
Chaos Engineering Tool

Simulates failures and edge cases for resilience testing.
"""

import os
import time
import random
import click
import psycopg2
import redis
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

def get_redis_connection():
    return redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', '6379')),
        db=0
    )

@click.group()
def chaos():
    """Chaos engineering commands."""
    pass

@chaos.command()
@click.option('--duration', default=30, help='Duration in seconds')
@click.option('--interval', default=5, help='Interval between failures')
def inject_latency(duration, interval):
    """Inject latency into database queries."""
    click.echo(f"Injecting latency for {duration} seconds...")
    # This would require database-level configuration
    # For demonstration, we'll just log
    click.echo("Latency injection simulated (requires DB configuration)")

@chaos.command()
@click.option('--keys', default=1000, help='Number of keys to corrupt')
def corrupt_redis(keys):
    """Corrupt random Redis keys."""
    r = get_redis_connection()
    click.echo(f"Corrupting {keys} Redis keys...")
    
    for i in range(keys):
        key = f"test:corrupt:{random.randint(1, 1000000)}"
        r.set(key, "corrupted_data")
        if i % 100 == 0:
            click.echo(f"Corrupted {i}/{keys} keys")
    
    click.echo("Redis corruption completed")

@chaos.command()
@click.option('--transactions', default=100, help='Number of transactions to corrupt')
def corrupt_transactions(transactions):
    """Corrupt random transaction states."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    click.echo(f"Corrupting {transactions} transactions...")
    
    cursor.execute("""
        SELECT payment_transaction_id FROM payment_transactions
        ORDER BY RANDOM() LIMIT %s
    """, (transactions,))
    
    txns = cursor.fetchall()
    
    for txn_id, in txns:
        cursor.execute("""
            UPDATE payment_transactions
            SET current_state = 'failed',
                failure_reason = 'Chaos test corruption'
            WHERE payment_transaction_id = %s
        """, (txn_id,))
    
    conn.commit()
    click.echo(f"Corrupted {len(txns)} transactions")
    
    cursor.close()
    conn.close()

@chaos.command()
def simulate_network_partition():
    """Simulate network partition (requires infrastructure)."""
    click.echo("Network partition simulation requires infrastructure-level configuration")
    click.echo("This would typically be done via Kubernetes network policies or firewall rules")

if __name__ == '__main__':
    chaos()





