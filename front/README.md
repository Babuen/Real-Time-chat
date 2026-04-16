# Real-Time Chat App (React + Django + PostgreSQL)

This project now keeps the same React UI but uses a Django REST backend with PostgreSQL.

## Frontend setup

1. Install frontend dependencies:
   `npm install`
2. Create frontend env file:
   `copy .env.example .env`
3. Start frontend:
   `npm run dev`

## Backend setup

1. Move into backend folder:
   `cd backend`
2. Create backend env file:
   `copy .env.example .env`
3. Create and activate virtual environment (Windows):
   `py -m venv .venv`
   `.venv\Scripts\activate`
4. Install backend dependencies:
   `pip install -r requirements.txt`
5. Run migrations:
   `python manage.py makemigrations`
   `python manage.py migrate`
6. Start Django API:
   `python manage.py runserver`

## Environment variables

Frontend:
- `VITE_API_URL` default is `http://127.0.0.1:8000/api`

Backend:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `CORS_ALLOWED_ORIGINS`

## Notes

- Chat updates are implemented with short-interval polling from the frontend.
- Avatar file upload is no longer stored via Firebase Storage; registration currently uses a plain avatar URL field.
