from django.urls import path
from .views import (
    AuthChangePasswordView,
    AuthLoginView,
    AuthLogoutView,
    AuthMeView,
    AuthProfileUpdateView,
    AuthRegisterView,
    ChatCreateView,
    ChatListView,
    ChatMessagesView,
    ChatSeenView,
    MessageCreateView,
    UserBlockToggleView,
    UserSearchView,
)

urlpatterns = [
    path("auth/register", AuthRegisterView.as_view(), name="auth-register"),
    path("auth/login", AuthLoginView.as_view(), name="auth-login"),
    path("auth/me", AuthMeView.as_view(), name="auth-me"),
    path("auth/logout", AuthLogoutView.as_view(), name="auth-logout"),
    path("auth/update-profile", AuthProfileUpdateView.as_view(), name="auth-update-profile"),
    path("auth/change-password", AuthChangePasswordView.as_view(), name="auth-change-password"),
    path("users/search", UserSearchView.as_view(), name="user-search"),
    path("users/<int:user_id>/block-toggle", UserBlockToggleView.as_view(), name="user-block-toggle"),
    path("chats", ChatListView.as_view(), name="chat-list"),
    path("chats/create", ChatCreateView.as_view(), name="chat-create"),
    path("chats/<int:chat_id>/seen", ChatSeenView.as_view(), name="chat-seen"),
    path("chats/<int:chat_id>/messages", ChatMessagesView.as_view(), name="chat-messages"),
    path("chats/<int:chat_id>/messages/create", MessageCreateView.as_view(), name="message-create"),
]
