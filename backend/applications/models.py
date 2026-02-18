from django.db import models


class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = 'APPLIED', 'Applied'
        INTERVIEW = 'INTERVIEW', 'Interview'
        REJECTED = 'REJECTED', 'Rejected'
        OFFER = 'OFFER', 'Offer'

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='applications', db_index=True)
    company = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    applied_date = models.DateField()
    match_score = models.IntegerField(default=0, help_text="Match Score (0-100)")
    job_link = models.URLField(max_length=500, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-applied_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', '-applied_date']),
            models.Index(fields=['company']),
        ]

    def __str__(self):
        return f'{self.company} - {self.role} ({self.status})'
