import logging

from rest_framework import serializers

from ai_engine.services.vector_store import upsert_documents

from .models import JobDescription

logger = logging.getLogger(__name__)


class JobDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = ('id', 'user', 'company', 'role', 'description', 'location', 'apply_url', 'source', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

    def create(self, validated_data):
        request = self.context['request']
        user = validated_data.pop('user', request.user)
        job = JobDescription.objects.create(user=user, **validated_data)
        try:
            upsert_documents(
                ids=[f'job-{job.id}'],
                documents=[job.description],
                metadatas=[{'user_id': user.id, 'source': 'job', 'job_id': job.id}],
            )
        except Exception:
            logger.exception('Job embedding index failed for job_id=%s user_id=%s', job.id, user.id)
        return job
