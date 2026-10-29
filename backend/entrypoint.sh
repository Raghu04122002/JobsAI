#!/bin/sh
set -e

PORT="${PORT:-8000}"

echo "Checking database connection..."
# Retry a few times (pooler cold starts), then fail loudly with a clear reason.
if ! python - <<'PY'
import os, sys, time
import django
from urllib.parse import urlparse

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "career_copilot.settings")
try:
    django.setup()
except Exception as exc:
    print(f"FATAL: Django settings failed to load: {exc}", file=sys.stderr)
    sys.exit(1)

from django.db import connection
from django.db.utils import OperationalError

url = os.getenv("DATABASE_URL", "")
target = urlparse(url).hostname if url else connection.settings_dict.get("HOST") or connection.settings_dict.get("NAME")
attempts = 5
for i in range(1, attempts + 1):
    try:
        connection.ensure_connection()
        print(f"Database reachable ({target}).")
        sys.exit(0)
    except OperationalError as exc:
        print(f"Database connection attempt {i}/{attempts} to {target} failed: {str(exc).strip()}", file=sys.stderr)
        if i < attempts:
            time.sleep(3)

print(
    "FATAL: Could not connect to the database. Check the DATABASE_URL env var "
    "(Supabase session pooler: aws-0-us-east-1.pooler.supabase.com:5432, user postgres.<project-ref>, "
    "?sslmode=require) and the password.",
    file=sys.stderr,
)
sys.exit(1)
PY
then
    exit 1
fi

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn on 0.0.0.0:${PORT}..."
exec gunicorn career_copilot.wsgi:application --bind "0.0.0.0:${PORT}"
