#!/bin/bash
set -e

echo "Starting Superset initialization..."
superset db upgrade

# create admin user only if it doesn't already exist to avoid errors in restart
superset fab create-admin \
    --username admin \
    --firstname admin \
    --lastname superset \
    --email admin@superset.local \
    --password admin \
    || echo "Admin might already exist, ignoring error"

echo "Initializing Superset roles and permissions..."
superset init

echo "Initialization complete. Starting web server..."
# Basic web server (Superset default is gunicorn)
exec gunicorn \
    -w 2 \
    -k gthread \
    --threads 10 \
    --timeout 120 \
    -b 0.0.0.0:8088 \
    "superset.app:create_app()"
