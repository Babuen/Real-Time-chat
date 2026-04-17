from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.URLField(blank=True, default="")
    about = models.CharField(max_length=255, blank=True, default="")
    blocked_users = models.ManyToManyField(User, blank=True, related_name="blocked_by_users")

    def __str__(self):
        return f"Profile({self.user.username})"


class SignupOTP(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField(db_index=True)
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"SignupOTP(email={self.email}, used={self.is_used})"


class Chat(models.Model):
    participants = models.ManyToManyField(User, through="ChatParticipant", related_name="chats")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat({self.id})"


class ChatParticipant(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_memberships")
    joined_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("chat", "user")

    def __str__(self):
        return f"ChatParticipant(chat={self.chat_id}, user={self.user_id})"


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message(chat={self.chat_id}, sender={self.sender_id})"
