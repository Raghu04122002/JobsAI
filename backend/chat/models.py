from django.db import models


class ChatSession(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='chat_sessions', db_index=True)
    title = models.CharField(max_length=255, default='Career Copilot Chat')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', '-created_at'])]


class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'USER', 'User'
        ASSISTANT = 'ASSISTANT', 'Assistant'

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages', db_index=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [models.Index(fields=['session', 'created_at'])]
