from rest_framework import serializers

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ('id', 'user', 'company', 'role', 'status', 'applied_date', 'match_score', 'job_link', 'notes', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
