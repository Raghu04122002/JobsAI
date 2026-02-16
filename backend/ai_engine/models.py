from django.db import models
from django.conf import settings
from resumes.models import Resume
from jobs.models import JobDescription

class AnalysisResult(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='analyses')
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE)
    job = models.ForeignKey(JobDescription, on_delete=models.CASCADE)
    
    match_score = models.IntegerField(default=0, help_text="Match Score (0-100)")
    # Using JSONField to store arrays of strings
    matched_keywords = models.JSONField(default=list)
    missing_keywords = models.JSONField(default=list)
    improvement_suggestions = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.job.title} ({self.match_score}%)"
