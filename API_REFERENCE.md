# API Reference

Base URL
- Local backend base URL: http://127.0.0.1:8000/api

Authentication
- Auth type: Token
- Header format: Authorization: Token <token>
- Public endpoints: register, login
- All other endpoints require token auth

Common response notes
- Validation and business rule errors use JSON with detail field.
- Typical error statuses:
  - 400 Bad Request
  - 403 Forbidden
  - 404 Not Found

---

## 1) Register
Endpoint
- POST /auth/register

Auth
- No token required

Request body
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123",
  "avatar": ""
}
```

Success response (201)
```json
{
  "token": "9f3b...",
  "user": {
    "id": 1,
    "uid": 1,
    "username": "alice",
    "email": "alice@example.com",
    "avatar": "",
    "about": "",
    "blocked": []
  }
}
```

Common errors
- 400 with detail: Username already exists
- 400 with detail: Email already exists

---

## 2) Login
Endpoint
- POST /auth/login

Auth
- No token required

Request body
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

Success response (200)
```json
{
  "token": "9f3b...",
  "user": {
    "id": 1,
    "uid": 1,
    "username": "alice",
    "email": "alice@example.com",
    "avatar": "",
    "about": "",
    "blocked": []
  }
}
```

Common errors
- 400 with detail: Invalid email or password

---

## 3) Current User
Endpoint
- GET /auth/me

Auth
- Token required

Success response (200)
```json
{
  "user": {
    "id": 1,
    "uid": 1,
    "username": "alice",
    "email": "alice@example.com",
    "avatar": "http://127.0.0.1:8000/media/avatars/user_1_x.jpg",
    "about": "Hello",
    "blocked": [2]
  }
}
```

---

## 4) Logout
Endpoint
- POST /auth/logout

Auth
- Token required

Success response (200)
```json
{
  "ok": true
}
```

---

## 5) Update Profile
Endpoint
- POST /auth/update-profile

Auth
- Token required

Content types
- application/json (for username, about, avatar URL)
- multipart/form-data (for avatar_file upload)

JSON request example
```json
{
  "username": "alice_new",
  "about": "My bio",
  "avatar": ""
}
```

Multipart request example fields
- username: alice_new
- about: My bio
- avatar_file: <image file>

Success response (200)
```json
{
  "user": {
    "id": 1,
    "uid": 1,
    "username": "alice_new",
    "email": "alice@example.com",
    "avatar": "http://127.0.0.1:8000/media/avatars/user_1_abcd.jpg",
    "about": "My bio",
    "blocked": []
  }
}
```

Common errors
- 400 with detail: Username already exists
- 400 with detail: Please upload a valid image file
- 400 with detail: Failed to upload avatar

---

## 6) Change Password
Endpoint
- POST /auth/change-password

Auth
- Token required

Request body
```json
{
  "current_password": "oldpass",
  "new_password": "newpass123"
}
```

Success response (200)
```json
{
  "detail": "Password updated",
  "token": "new-token-value",
  "user": {
    "id": 1,
    "uid": 1,
    "username": "alice",
    "email": "alice@example.com",
    "avatar": "",
    "about": "",
    "blocked": []
  }
}
```

Common errors
- 400 with detail: Current password is incorrect

---

## 7) Search Users
Endpoint
- GET /users/search?q=<query>

Auth
- Token required

Query params
- q: required for useful results

Success response (200)
```json
{
  "results": [
    {
      "id": 2,
      "username": "bob",
      "email": "bob@example.com",
      "avatar": "",
      "about": "",
      "blocked": []
    }
  ]
}
```

Notes
- Empty q returns results as empty list.
- Current user is excluded.

---

## 8) Block or Unblock User
Endpoint
- POST /users/{user_id}/block-toggle

Auth
- Token required

Path params
- user_id: integer target user id

Success response (200)
```json
{
  "blocked": true,
  "blockedIds": [2, 5]
}
```

Common errors
- 400 with detail: Cannot block yourself
- 404 with detail: User not found

---

## 9) List Chats
Endpoint
- GET /chats

Auth
- Token required

Success response (200)
```json
{
  "chats": [
    {
      "chatId": 10,
      "receiverId": 2,
      "receiverName": "bob",
      "receiverAvatar": "",
      "receiverAbout": "",
      "receiverBlocked": [],
      "lastMessage": "Hi",
      "updatedAt": 1776384600000,
      "isSeen": false,
      "unreadCount": 3
    }
  ]
}
```

---

## 10) Create Chat
Endpoint
- POST /chats/create

Auth
- Token required

Request body
```json
{
  "receiver_id": 2
}
```

Success response (200)
```json
{
  "chat": {
    "chatId": 10,
    "receiverId": 2,
    "receiverName": "bob",
    "receiverAvatar": "",
    "receiverAbout": "",
    "receiverBlocked": [],
    "lastMessage": "",
    "updatedAt": 1776384600000,
    "isSeen": true,
    "unreadCount": 0
  }
}
```

Common errors
- 400 with detail: Cannot start chat with yourself
- 404 with detail: User not found

---

## 11) Mark Chat as Seen
Endpoint
- POST /chats/{chat_id}/seen

Auth
- Token required

Success response (200)
```json
{
  "ok": true
}
```

Common errors
- 404 with detail: Chat not found

---

## 12) Get Messages
Endpoint
- GET /chats/{chat_id}/messages

Auth
- Token required

Success response (200)
```json
{
  "messages": [
    {
      "id": 101,
      "senderId": 1,
      "text": "Hello",
      "created_at": "2026-04-17T12:00:00.000000Z"
    },
    {
      "id": 102,
      "senderId": 2,
      "text": "Hi",
      "created_at": "2026-04-17T12:00:05.000000Z"
    }
  ]
}
```

Common errors
- 404 with detail: Chat not found

---

## 13) Send Message
Endpoint
- POST /chats/{chat_id}/messages/create

Auth
- Token required

Request body
```json
{
  "text": "How are you?"
}
```

Success response (201)
```json
{
  "message": {
    "id": 103,
    "senderId": 1,
    "text": "How are you?",
    "created_at": "2026-04-17T12:00:10.000000Z"
  }
}
```

Common errors
- 404 with detail: Chat not found
- 400 with detail: Chat receiver missing
- 403 with detail: You are blocked by this user
- 403 with detail: Unblock this user to send messages

---

## 14) Quick Testing with curl
Replace TOKEN and IDs with real values.

Register
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"secret123"}'
```

Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

Get chats
```bash
curl -X GET http://127.0.0.1:8000/api/chats \
  -H "Authorization: Token TOKEN"
```

Send message
```bash
curl -X POST http://127.0.0.1:8000/api/chats/10/messages/create \
  -H "Authorization: Token TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello"}'
```
