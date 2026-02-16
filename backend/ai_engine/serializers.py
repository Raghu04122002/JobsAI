from rest_framework import serializers


class AnalyzeRequestSerializer(serializers.Serializer):
    query = serializers.CharField(min_length=3)
    top_k = serializers.IntegerField(min_value=1, max_value=20, default=8)


class TailorRequestSerializer(serializers.Serializer):
    query = serializers.CharField(required=False, allow_blank=True)
    resume_id = serializers.IntegerField(required=False, min_value=1)
    job_id = serializers.IntegerField(required=False, min_value=1)
    top_k = serializers.IntegerField(min_value=1, max_value=20, default=8)


class MatchRequestSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField(min_value=1)
    job_id = serializers.IntegerField(min_value=1)


class AnalysisResultSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    company = serializers.CharField(source='job.company', read_only=True)

    class Meta:
        from .models import AnalysisResult
        model = AnalysisResult
        fields = ['id', 'match_score', 'matched_keywords', 'missing_keywords', 'improvement_suggestions', 'job_title', 'company', 'created_at']

