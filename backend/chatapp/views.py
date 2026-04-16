import os
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Chat, ChatParticipant, Message, UserProfile
from .serializers import (
    ChangePasswordSerializer,
    ChatCreateSerializer,
    LoginSerializer,
    MessageCreateSerializer,
    MessageResponseSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserResponseSerializer,
)


def ensure_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def user_payload(user):
    profile = ensure_profile(user)
    return {
        "id": user.id,
        "uid": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": profile.avatar,
        "about": profile.about,
        "blocked": list(profile.blocked_users.values_list("id", flat=True)),
    }


def get_chat_for_pair(user_a, user_b):
    shared_ids = (
        Chat.objects.filter(participants=user_a)
        .filter(participants=user_b)
        .distinct()
        .values_list("id", flat=True)
    )
    if not shared_ids:
        return None
    return Chat.objects.get(id=shared_ids[0])


def chat_summary_for_user(chat, current_user):
    receiver = chat.participants.exclude(id=current_user.id).first()
    if not receiver:
        return None

    receiver_profile = ensure_profile(receiver)
    membership = ChatParticipant.objects.filter(chat=chat, user=current_user).first()
    last_message = chat.messages.order_by("-created_at").first()

    is_seen = True
    unread_count = 0
    if membership and last_message and membership.last_seen_at:
        is_seen = membership.last_seen_at >= last_message.created_at
        unread_count = chat.messages.filter(
            sender_id=receiver.id,
            created_at__gt=membership.last_seen_at,
        ).count()
    elif membership and last_message and membership.last_seen_at is None:
        is_seen = last_message.sender_id == current_user.id
        unread_count = chat.messages.filter(sender_id=receiver.id).count()

    return {
        "chatId": chat.id,
        "receiverId": receiver.id,
        "receiverName": receiver.username,
        "receiverAvatar": receiver_profile.avatar,
        "receiverAbout": receiver_profile.about,
        "receiverBlocked": list(receiver_profile.blocked_users.values_list("id", flat=True)),
        "lastMessage": last_message.text if last_message else "",
        "updatedAt": int(chat.updated_at.timestamp() * 1000),
        "isSeen": is_seen,
        "unreadCount": unread_count,
    }


class AuthRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(
            username=serializer.validated_data["username"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        profile = ensure_profile(user)
        profile.avatar = serializer.validated_data.get("avatar", "")
        profile.save(update_fields=["avatar"])

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": user_payload(user)}, status=status.HTTP_201_CREATED)


class AuthLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        password = serializer.validated_data["password"]

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

        authenticated = authenticate(request, username=user.username, password=password)
        if not authenticated:
            return Response({"detail": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

        token, _ = Token.objects.get_or_create(user=authenticated)
        return Response({"token": token.key, "user": user_payload(authenticated)})


class AuthMeView(APIView):
    def get(self, request):
        return Response({"user": user_payload(request.user)})


class AuthLogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"ok": True})


class AuthProfileUpdateView(APIView):
    def post(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        next_username = serializer.validated_data.get("username", "").strip()
        next_about = serializer.validated_data.get("about")
        next_avatar = serializer.validated_data.get("avatar")
        avatar_file = serializer.validated_data.get("avatar_file")

        if next_username:
            exists = User.objects.filter(username__iexact=next_username).exclude(id=request.user.id).exists()
            if exists:
                return Response({"detail": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
            request.user.username = next_username
            request.user.save(update_fields=["username"])

        profile = ensure_profile(request.user)

        if avatar_file is not None:
            content_type = getattr(avatar_file, "content_type", "") or ""
            if not content_type.startswith("image/"):
                return Response({"detail": "Please upload a valid image file"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                extension = os.path.splitext(avatar_file.name)[1] or ".jpg"
                relative_path = f"avatars/user_{request.user.id}_{uuid4().hex}{extension}"
                saved_path = default_storage.save(relative_path, avatar_file)
                profile.avatar = request.build_absolute_uri(default_storage.url(saved_path))
                profile.save(update_fields=["avatar"])
            except Exception:
                return Response({"detail": "Failed to upload avatar"}, status=status.HTTP_400_BAD_REQUEST)

        if next_avatar is not None:
            profile.avatar = next_avatar
            profile.save(update_fields=["avatar"])

        if next_about is not None:
            profile.about = next_about.strip()
            profile.save(update_fields=["about"])

        return Response({"user": user_payload(request.user)})


class AuthChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]

        if not request.user.check_password(current_password):
            return Response({"detail": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])

        # Rotate auth token after password change.
        Token.objects.filter(user=request.user).delete()
        token = Token.objects.create(user=request.user)
        return Response({"detail": "Password updated", "token": token.key, "user": user_payload(request.user)})


class UserSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"results": []})

        users = (
            User.objects.filter(
                Q(username__iexact=query) | Q(email__iexact=query) | Q(username__icontains=query)
            )
            .exclude(id=request.user.id)
            .order_by("username")[:10]
        )

        data = UserResponseSerializer(users, many=True).data
        return Response({"results": data})


class UserBlockToggleView(APIView):
    def post(self, request, user_id):
        if user_id == request.user.id:
            return Response({"detail": "Cannot block yourself"}, status=status.HTTP_400_BAD_REQUEST)

        target = User.objects.filter(id=user_id).first()
        if not target:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        profile = ensure_profile(request.user)
        is_blocked = profile.blocked_users.filter(id=user_id).exists()
        if is_blocked:
            profile.blocked_users.remove(target)
        else:
            profile.blocked_users.add(target)

        profile.save()
        return Response({"blocked": not is_blocked, "blockedIds": list(profile.blocked_users.values_list("id", flat=True))})


class ChatListView(APIView):
    def get(self, request):
        chats = (
            Chat.objects.filter(participants=request.user)
            .prefetch_related("participants", "messages")
            .order_by("-updated_at")
        )

        summaries = []
        for chat in chats:
            summary = chat_summary_for_user(chat, request.user)
            if summary:
                summaries.append(summary)

        summaries.sort(key=lambda item: item["updatedAt"], reverse=True)
        return Response({"chats": summaries})


class ChatCreateView(APIView):
    def post(self, request):
        serializer = ChatCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        receiver_id = serializer.validated_data["receiver_id"]

        if receiver_id == request.user.id:
            return Response({"detail": "Cannot start chat with yourself"}, status=status.HTTP_400_BAD_REQUEST)

        receiver = User.objects.filter(id=receiver_id).first()
        if not receiver:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        chat = get_chat_for_pair(request.user, receiver)
        if not chat:
            chat = Chat.objects.create()
            ChatParticipant.objects.create(chat=chat, user=request.user, last_seen_at=timezone.now())
            ChatParticipant.objects.create(chat=chat, user=receiver)

        summary = chat_summary_for_user(chat, request.user)
        return Response({"chat": summary})


class ChatSeenView(APIView):
    def post(self, request, chat_id):
        membership = ChatParticipant.objects.filter(chat_id=chat_id, user=request.user).first()
        if not membership:
            return Response({"detail": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        membership.last_seen_at = timezone.now()
        membership.save(update_fields=["last_seen_at"])
        return Response({"ok": True})


class ChatMessagesView(APIView):
    def get(self, request, chat_id):
        is_member = ChatParticipant.objects.filter(chat_id=chat_id, user=request.user).exists()
        if not is_member:
            return Response({"detail": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        messages = Message.objects.filter(chat_id=chat_id).select_related("sender")
        data = MessageResponseSerializer(messages, many=True).data
        return Response({"messages": data})


class MessageCreateView(APIView):
    def post(self, request, chat_id):
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        membership = ChatParticipant.objects.filter(chat_id=chat_id, user=request.user).first()
        if not membership:
            return Response({"detail": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)

        chat = Chat.objects.filter(id=chat_id).first()
        receiver = chat.participants.exclude(id=request.user.id).first() if chat else None
        if not receiver:
            return Response({"detail": "Chat receiver missing"}, status=status.HTTP_400_BAD_REQUEST)

        sender_profile = ensure_profile(request.user)
        receiver_profile = ensure_profile(receiver)

        if receiver_profile.blocked_users.filter(id=request.user.id).exists():
            return Response({"detail": "You are blocked by this user"}, status=status.HTTP_403_FORBIDDEN)

        if sender_profile.blocked_users.filter(id=receiver.id).exists():
            return Response({"detail": "Unblock this user to send messages"}, status=status.HTTP_403_FORBIDDEN)

        message = Message.objects.create(chat=chat, sender=request.user, text=serializer.validated_data["text"].strip())
        chat.updated_at = timezone.now()
        chat.save(update_fields=["updated_at"])

        ChatParticipant.objects.filter(chat=chat, user=request.user).update(last_seen_at=timezone.now())

        return Response({"message": MessageResponseSerializer(message).data}, status=status.HTTP_201_CREATED)
