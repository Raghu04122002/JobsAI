import logging

from rest_framework import serializers

from .models import Resume
from .services import extract_text_from_file, index_resume

logger = logging.getLogger(__name__)


class ResumeSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)

    class Meta:
        model = Resume
        fields = ('id', 'user', 'title', 'file', 'extracted_text', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'extracted_text', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context['request']
        user = validated_data.pop('user', request.user)
        uploaded_file = validated_data['file']

        title = (validated_data.get('title') or '').strip()
        if not title:
            validated_data['title'] = uploaded_file.name.rsplit('.', 1)[0]

        text = extract_text_from_file(uploaded_file)
        uploaded_file.seek(0)
        resume = Resume.objects.create(user=user, extracted_text=text, **validated_data)
        try:
            index_resume(user.id, resume.id, text)
        except Exception:
            logger.exception('Resume indexed failed for resume_id=%s user_id=%s', resume.id, user.id)
        return resume
