# CampusEventHUB — Backend (FastAPI)

> **Phase O / P / Q** — Backend planning and implementation.
>
> The frontend must be fully complete before backend work begins.
> See `/docs/Development_plan.md` for the full phase sequence.

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Framework    | FastAPI                 |
| Database     | PostgreSQL (via SQLAlchemy) |
| Auth         | JWT (OAuth2 Password Bearer) |
| Validation   | Pydantic v2             |
| Migrations   | Alembic                 |
| Server       | Uvicorn                 |

## Planned Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings (env vars)
│   ├── database.py          # DB engine + session
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── event.py
│   │   ├── club.py
│   │   ├── category.py
│   │   └── registration.py
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── event.py
│   │   ├── club.py
│   │   ├── category.py
│   │   └── registration.py
│   ├── routers/             # API route handlers
│   │   ├── auth.py
│   │   ├── students.py
│   │   ├── organizers.py
│   │   ├── admin.py
│   │   ├── events.py
│   │   ├── clubs.py
│   │   ├── categories.py
│   │   └── registrations.py
│   ├── crud/                # Database CRUD helpers
│   │   ├── user.py
│   │   ├── event.py
│   │   ├── club.py
│   │   └── registration.py
│   ├── core/
│   │   ├── security.py      # Password hashing, JWT
│   │   └── dependencies.py  # FastAPI dependency injection
│   └── utils/
│       └── email.py         # Email notifications (future)
├── alembic/                 # Database migrations
├── tests/                   # Unit + integration tests
├── requirements.txt
├── requirements-dev.txt
└── .env.example
```

## API Route Plan

### Authentication
- `POST /api/v1/auth/login` — Login (student / organizer / admin)
- `POST /api/v1/auth/logout` — Logout
- `GET  /api/v1/auth/me` — Current user info

### Events
- `GET    /api/v1/events` — List events (filters: category, club, status, search)
- `POST   /api/v1/events` — Create event (organizer/admin)
- `GET    /api/v1/events/{id}` — Event details
- `PUT    /api/v1/events/{id}` — Update event (organizer/admin)
- `DELETE /api/v1/events/{id}` — Delete event (admin)

### Clubs
- `GET    /api/v1/clubs` — List clubs
- `POST   /api/v1/clubs` — Create club (admin)
- `GET    /api/v1/clubs/{id}` — Club details
- `PUT    /api/v1/clubs/{id}` — Update club (admin)
- `PATCH  /api/v1/clubs/{id}/status` — Activate/deactivate (admin)

### Categories
- `GET    /api/v1/categories` — List categories
- `POST   /api/v1/categories` — Create category (admin)
- `PUT    /api/v1/categories/{id}` — Update category (admin)
- `PATCH  /api/v1/categories/{id}/status` — Activate/deactivate (admin)

### Registrations
- `POST   /api/v1/events/{id}/register` — Register for event (student)
- `DELETE /api/v1/events/{id}/register` — Cancel registration (student)
- `GET    /api/v1/events/{id}/registrations` — List registrants (organizer/admin)

### Admin
- `GET    /api/v1/admin/students` — List students
- `GET    /api/v1/admin/organizers` — List organizers
- `PATCH  /api/v1/admin/users/{id}/status` — Suspend/activate user
- `GET    /api/v1/admin/reports/summary` — Summary stats

## Setup (when implementation begins)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database URL and secret key
uvicorn app.main:app --reload
```

## Status

> 🔲 **Not started** — Waiting for frontend Phase N completion.
