from django.db import models


class Resume(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='resumes', db_index=True)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='resumes/')
    extracted_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'{self.user.email} - {self.title}'
