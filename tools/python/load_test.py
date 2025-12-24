#!/usr/bin/env python3
"""
Load Testing Tool

Generates synthetic load for testing system performance.
"""

import os
import time
import json
import random
import click
from faker import Faker
from locust import HttpUser, task, between
from dotenv import load_dotenv

load_dotenv()

fake = Faker()

class PaySignalUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login and get auth token."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})
    
    @task(3)
    def get_transactions(self):
        """Get transactions list."""
        self.client.get("/api/v1/transactions")
    
    @task(2)
    def get_health(self):
        """Check health endpoint."""
        self.client.get("/health")
    
    @task(1)
    def get_alerts(self):
        """Get alerts."""
        self.client.get("/api/v1/alerts")

@click.command()
@click.option('--host', default='http://localhost:8080', help='Target host')
@click.option('--users', default=10, help='Number of concurrent users')
@click.option('--spawn-rate', default=2, help='Users spawned per second')
@click.option('--duration', default=60, help='Test duration in seconds')
@click.option('--web-ui', is_flag=True, help='Start web UI')
def run_load_test(host, users, spawn_rate, duration, web_ui):
    """Run load test against PaySignal API."""
    import subprocess
    
    cmd = [
        'locust',
        '-f', __file__,
        '--host', host,
        '--users', str(users),
        '--spawn-rate', str(spawn_rate),
        '--run-time', f'{duration}s',
        '--headless'
    ]
    
    if web_ui:
        cmd.remove('--headless')
        cmd.extend(['--web-host', '0.0.0.0', '--web-port', '8089'])
    
    click.echo(f"Starting load test: {users} users, {duration}s duration")
    subprocess.run(cmd)

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'run':
        run_load_test()
    else:
        # This will be imported by locust
        pass





