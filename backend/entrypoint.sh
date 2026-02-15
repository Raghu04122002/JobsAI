#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py create_superuser
python manage.py collectstatic --noinput
exec gunicorn career_copilot.wsgi:application -c career_copilot/gunicorn_conf.py
