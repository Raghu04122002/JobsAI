from django.db import models


class JobDescription(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='jobs', db_index=True)
    company = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255, blank=True, default='')
    apply_url = models.URLField(max_length=1024, blank=True, default='')
    source = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', '-created_at']), models.Index(fields=['company'])]

    def __str__(self):
        return f'{self.company} - {self.role}'

