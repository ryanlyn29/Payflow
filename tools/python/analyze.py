#!/usr/bin/env python3
"""
Offline Analysis Tool

Analyzes payment transaction data for patterns and anomalies.
"""

import os
import sys
import click
import pandas as pd
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
@click.option('--output', default='analysis_report.json', help='Output file')
def analyze(start_date, end_date, output):
    """Analyze payment transactions."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    click.echo(f"Analyzing transactions from {start_date} to {end_date}")
    
    # Fetch transactions
    cursor.execute("""
        SELECT 
            payment_transaction_id,
            merchant_id,
            amount,
            currency,
            current_state,
            created_at,
            retry_count,
            failure_reason
        FROM payment_transactions
        WHERE created_at >= %s AND created_at <= %s
    """, (start, end))
    
    transactions = cursor.fetchall()
    
    if not transactions:
        click.echo("No transactions found")
        return
    
    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    
    # Analysis
    report = {
        'period': {
            'start': start_date,
            'end': end_date
        },
        'summary': {
            'total_transactions': len(df),
            'total_amount': float(df['amount'].sum()),
            'avg_amount': float(df['amount'].mean()),
            'states': df['current_state'].value_counts().to_dict(),
            'merchants': df['merchant_id'].nunique(),
            'failure_rate': float((df['current_state'] == 'failed').sum() / len(df) * 100),
            'avg_retry_count': float(df['retry_count'].mean())
        },
        'top_merchants': df.groupby('merchant_id')['amount'].sum().nlargest(10).to_dict(),
        'hourly_distribution': df.groupby(df['created_at'].dt.hour).size().to_dict()
    }
    
    # Save report
    import json
    with open(output, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    click.echo(f"Analysis complete! Report saved to {output}")
    click.echo(f"\nSummary:")
    click.echo(f"  Total transactions: {report['summary']['total_transactions']}")
    click.echo(f"  Total amount: ${report['summary']['total_amount']:,.2f}")
    click.echo(f"  Failure rate: {report['summary']['failure_rate']:.2f}%")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    analyze()





