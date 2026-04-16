from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Chat, Message


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    avatar = serializers.URLField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value.lower()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UpdateProfileSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    about = serializers.CharField(max_length=255, required=False, allow_blank=True)
    avatar = serializers.URLField(required=False, allow_blank=True)
    avatar_file = serializers.FileField(required=False)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=6, write_only=True)


class MessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=5000)


class ChatCreateSerializer(serializers.Serializer):
    receiver_id = serializers.IntegerField(min_value=1)


class UserSearchSerializer(serializers.Serializer):
    q = serializers.CharField(max_length=150)


class UserResponseSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    blocked = serializers.SerializerMethodField()
    about = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar", "about", "blocked"]

    def get_avatar(self, obj):
        return getattr(obj.profile, "avatar", "")

    def get_blocked(self, obj):
        blocked_ids = list(getattr(obj.profile, "blocked_users", User.objects.none()).values_list("id", flat=True))
        return blocked_ids

    def get_about(self, obj):
        return getattr(obj.profile, "about", "")


class MessageResponseSerializer(serializers.ModelSerializer):
    senderId = serializers.IntegerField(source="sender_id")

    class Meta:
        model = Message
        fields = ["id", "senderId", "text", "created_at"]


class ChatSummarySerializer(serializers.Serializer):
    chatId = serializers.IntegerField()
    receiverId = serializers.IntegerField()
    receiverName = serializers.CharField()
    receiverAvatar = serializers.CharField(allow_blank=True)
    receiverAbout = serializers.CharField(allow_blank=True)
    receiverBlocked = serializers.ListField(child=serializers.IntegerField())
    lastMessage = serializers.CharField(allow_blank=True)
    updatedAt = serializers.IntegerField()
    isSeen = serializers.BooleanField()
    unreadCount = serializers.IntegerField()


class ChatMessagesSerializer(serializers.Serializer):
    chat_id = serializers.IntegerField()
    messages = MessageResponseSerializer(many=True)


class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = ["id", "created_at", "updated_at"]
