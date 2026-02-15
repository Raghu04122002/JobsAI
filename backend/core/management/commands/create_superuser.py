from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create superuser from env vars if not exists'

    def handle(self, *args, **options):
        email = self._env('DJANGO_SUPERUSER_EMAIL')
        password = self._env('DJANGO_SUPERUSER_PASSWORD')
        username = self._env('DJANGO_SUPERUSER_USERNAME', default='admin')
        if not email or not password:
            return

        user_model = get_user_model()
        if user_model.objects.filter(email=email).exists():
            self.stdout.write(f'Superuser already exists: {email}')
            return

        user_model.objects.create_superuser(email=email, username=username, password=password)
        self.stdout.write(f'Superuser created: {email}')

    @staticmethod
    def _env(name, default=None):
        from os import getenv

        return getenv(name, default)
