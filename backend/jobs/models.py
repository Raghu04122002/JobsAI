from django.db import models


class JobDescription(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='jobs', db_index=True)
    company = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', '-created_at']), models.Index(fields=['company'])]

    def __str__(self):
        return f'{self.company} - {self.role}'
