# campusEventHUB

A modern  campus event management and activity discovery platform tailored for IIIT Vadodara.

---
##  LINKS-

   Google drive - https://drive.google.com/drive/folders/1-ekxGUW_AxeZAvrrflxqz0vCRvsnkP4u?usp=drive_link
   Github repo - https://github.com/yogitagothi2411/CampusHUB


## Architecture Overview

```
campusEventHUB/
├── frontend/          # React 19 + Vite + Tailwind CSS v4 + Axios
│   ├── src/
│   │   ├── components/ # Common UI & event components (Card, Button, EventCard, NotificationBell, etc.)
│   │   ├── context/    # Session & Authentication context (AuthContext, useAuth)
│   │   ├── layouts/    # Role layouts (StudentLayout, OrganizerLayout, AdminLayout)
│   │   ├── pages/      # Student, Organizer, Admin, Auth & Announcements pages
│   │   ├── services/   # Centralized Axios API client (api.js)
│   │   └── data/       # IIIT Vadodara catalog data & mock registries
│   ├── .env            # VITE_API_BASE_URL=http://127.0.0.1:8000
│   └── .env.example
├── backend/           # Python FastAPI + SQLAlchemy + SQLite + JWT Authentication
│   ├── services/
│   │   ├── auth/           # OAuth2 JWT login, registration, role checks, password hashing
│   │   ├── event_services/ # Event CRUD, database models, CORS middleware, app entrypoint
│   │   ├── clubs/          # Club management (models, schemas, router)
│   │   ├── registrations/  # Event registrations (models, schemas, router)
│   │   ├── notifications/  # In-app user notifications (models, schemas, router)
│   │   └── announcements/  # College-wide announcements (models, schemas, router)
│   ├── data/          # campus_events.db (SQLite database)
│   └── tests/         # Pytest test suite (33 test cases)
└── docs/              # Specifications, SRS & Phase implementation plans
```

---

## Quick Start & Running Locally

### 1. Backend Terminal (FastAPI)

```powershell
cd C:\Users\hp\Desktop\campusEventHUB\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn services.event_services.main:app --reload --port 8000
```

- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### 2. Frontend Terminal (React + Vite)

```powershell
cd C:\Users\hp\Desktop\campusEventHUB\frontend
npm install
npm run dev
```

- **Application URL**: `http://localhost:5173` (or `http://127.0.0.1:5173`)

---

## Environment Variables

### Frontend (`frontend/.env` and `frontend/.env.example`)

```ini
# FastAPI Backend API Base URL
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Backend (`backend/.env` optional)

```ini
# Configurable CORS origins (comma-separated, default: localhost:5173, 127.0.0.1:5173)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=sqlite:///./data/campus_events.db
```

---

## Authentication & Demo Credentials

Users can register new accounts via the public registration tab on the login screen, or log in using pre-seeded demo accounts:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@iiitvadodara.ac.in` | `admin123` | Full event CRUD, modify/delete any event, manage users, clubs & announcements |
| **Organizer** | `organizer@iiitvadodara.ac.in` | `organizer123` | Create events, edit/manage own events, view registrations, receive notifications |
| **Student** | `student@iiitvadodara.ac.in` | `student123` | Discover events, search/filter, register for events, receive notifications |

> **Security Note:** Public registration allows only `student` and `organizer` accounts. Attempts to register with `role: "admin"` are rejected by the backend with HTTP `400 Bad Request`.

---

## API Reference

### Authentication (`/auth`)

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `POST` | `/auth/register` | Public | Register a new user (`student` or `organizer` only) |
| `POST` | `/auth/login` | Public | Login and receive JWT access token |
| `GET`  | `/auth/me` | Bearer | Get current authenticated user profile |

### Events (`/events`)

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `GET`    | `/events` | Public | List all events (filter by category, timing, search) |
| `GET`    | `/events/{id}` | Public | Get a single event by ID |
| `POST`   | `/events` | Organizer / Admin | Create a new event |
| `PUT`    | `/events/{id}` | Owner / Admin | Full event update |
| `PATCH`  | `/events/{id}` | Owner / Admin | Partial event update |
| `DELETE` | `/events/{id}` | Owner / Admin | Delete an event (notifies registered students) |

### Clubs (`/clubs`)

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `GET`    | `/clubs` | Public | List all IIIT Vadodara clubs |
| `GET`    | `/clubs/{id}` | Public | Get a club by ID |
| `POST`   | `/clubs` | Admin | Create a new club |
| `PUT`    | `/clubs/{id}` | Admin | Update a club |
| `DELETE` | `/clubs/{id}` | Admin | Delete a club |

Clubs are automatically seeded on startup with all 14 official IIIT Vadodara clubs.

### Event Registrations (`/events/{id}/registrations`)

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `POST`   | `/events/{id}/registrations` | Student | Register for an event |
| `DELETE` | `/events/{id}/registrations` | Student | Cancel own registration |
| `GET`    | `/events/{id}/registrations` | Owner / Admin | List all attendees for an event |
| `GET`    | `/events/{id}/registrations/my` | Student | Check own registration status |

Registration enforces capacity limits and prevents duplicate registrations with HTTP `409 Conflict`.

### Notifications (`/notifications`)

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `GET`  | `/notifications` | Bearer | List own notifications |
| `GET`  | `/notifications/unread-count` | Bearer | Get unread notification count |
| `POST` | `/notifications/{id}/read` | Bearer | Mark a notification as read |
| `POST` | `/notifications/read-all` | Bearer | Mark all notifications as read |

Notifications are automatically created when:
- A student registers for or cancels an event.
- An organizer's event is updated, cancelled, or deleted by an admin.

### Announcements (`/announcements`)

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `GET`  | `/announcements` | Optional Auth | List published announcements (paginated) |
| `GET`  | `/announcements/{id}` | Optional Auth | Get a single announcement |
| `POST` | `/announcements` | Admin | Create a new announcement |
| `PUT`  | `/announcements/{id}` | Admin | Update an announcement |
| `DELETE` | `/announcements/{id}` | Admin | Delete an announcement |

---

## Database Schema

```
users               → id, name, email, hashed_password, role, created_at
events              → id, title, description, category, date_time, location,
                      capacity, organizer_id, created_at, updated_at
clubs               → id, name, description, category, founded_year,
                      member_count, contact_email, logo_url, is_active
event_registrations → id, event_id, student_id, status, registered_at, cancelled_at
notifications       → id, user_id, title, message, is_read, notif_type,
                      related_event_id, created_at
announcements       → id, title, content, author_id, is_published,
                      priority, created_at, updated_at
```

---

## Testing & Quality Assurance

### Run Backend Pytest Suite (33/33 Passing)

```powershell
cd C:\Users\hp\Desktop\campusEventHUB\backend
.\.venv\Scripts\python.exe -m pytest -v
```

Tests cover:
- CORS preflight and origin validation.
- User registration (`student` and `organizer`).
- Public admin role rejection (HTTP 400).
- Password hashing using bcrypt.
- JWT token issuing, expiry, and unauthorized access rejection.
- Role-based route authorization.
- Event CRUD with ownership enforcement.
- Club listing (public) and admin CRUD.
- Event registration with capacity enforcement and duplicate rejection.
- Registration cancellation and attendee listing permissions.
- Notification creation, unread count, and mark-as-read.
- Announcement publishing and management.

All tests run against an **isolated in-memory SQLite database** — the development database is never modified.

### Run Frontend Lint & Build (0 Errors)

```powershell
cd C:\Users\hp\Desktop\campusEventHUB\frontend
npm run lint
npm run build
```

Production bundle: **713 kB JS** / **59 kB CSS** (gzip: 170 kB / 11 kB).

---

## Feature Summary by Phase

| Phase | Feature | Status |
| :---- | :------ | :----- |
| 1–2 | React UI, routing, role layouts, IIIT Vadodara data | ✅ Complete |
| 3 | FastAPI backend, auth, JWT, role-based event CRUD | ✅ Complete |
| 4 | Frontend–backend integration, live API, session persistence | ✅ Complete |
| 5 | Persistent clubs (SQLite), event registration with capacity enforcement | ✅ Complete |
| 6 | In-app notifications, college announcements, notification bell UI | ✅ Complete |