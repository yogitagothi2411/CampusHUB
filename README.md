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
campusEventHUB
A campus event management and activity discovery platform designed for IIIT Vadodara. campusEventHUB brings students, event organizers, and administrators together through a single platform for discovering campus activities, managing events, handling registrations, and sharing college announcements.
Project Links
- GitHub: https://github.com/yogitagothi2411/CampusHUB
- Google Drive: https://drive.google.com/drive/folders/1-ekxGUW_AxeZAvrrflxqz0vCRvsnkP4u?usp=drive_link
Technology Stack
Frontend
- React 19
- Vite
- Tailwind CSS v4
- React Router
- Axios
- Lucide React
Backend
- Node.js
- Express.js
- Microservices architecture
- Express API Gateway with http-proxy-middleware
- JWT authentication (jsonwebtoken)
- Password hashing with bcryptjs
- SQLite databases using better-sqlite3
- CORS and API rate limiting
Development Tools
- npm workspaces
- ESLint
- Jest and Supertest dependencies for service tests
Architecture Overview
The application is organized into a React frontend and a Node.js microservices backend. The API Gateway is the frontend's single backend entry point and forwards requests to the appropriate service.
campusEventHUB/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── events/
│   │   ├── context/             # Authentication context and hooks
│   │   ├── data/                # Frontend catalog and data modules
│   │   ├── layouts/             # Student, Organizer and Admin layouts
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── organizer/
│   │   │   └── student/
│   │   ├── routes/
│   │   ├── services/            # API client
│   │   └── utils/
│   ├── .env.example
│   └── package.json
│
├── Server/
│   ├── api-gateway/
│   │   └── src/server.js
│   ├── services/
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   ├── event-service/
│   │   ├── registration-service/    # Expected by the service manager
│   │   ├── club-service/
│   │   ├── notification-service/
│   │   └── announcement-service/
│   ├── start.js
│   ├── seed-all.js
│   ├── verify-all.js
│   └── package.json
│
├── docs/
│   ├── Development_plan.md
│   └── SRS.md
├── Assignment/
└── README.md
Backend services
Component	Default port	Responsibility
API Gateway	3000	Single entry point, reverse proxy, request IDs, rate limiting and routing
Auth Service	3001	Registration, login, JWT issuance and authentication
User Service	3002	User profile endpoints
Event Service	3003	Event listing, details, creation, updates and deletion
Registration Service	3004	Event registration and attendee-related operations
Club Service	3005	Club and category catalog
Notification Service	3006	In-app notifications
Announcement Service	3007	College announcements


Each service is designed to own its data and expose its API independently. The service manager in Server/start.js is configured to start all services and the gateway together.
Features
Student
- Browse and discover campus events.
- Explore event categories and IIIT Vadodara clubs.
- View event details and past events.
- Register for events and manage registrations.
- View announcements and notifications.
- Manage a student profile.
Organizer
- Access an organizer dashboard.
- Create and manage events.
- Edit event information.
- View event registrations and attendee details.
- Manage an organizer profile.
Administrator
- Access an admin dashboard.
- Manage events, organizers and students.
- Manage clubs and categories.
- View reports.
- Publish and manage college-wide announcements.
Platform
- Role-based access for students, organizers and administrators.
- JWT-based authentication.
- Password hashing.
- API Gateway routing to backend services.
- SQLite-backed service data.
- API health endpoints.
Getting Started
Prerequisites
Install the following before running the project:
- Node.js 20 or later
- npm (included with Node.js)
- Git
Check your installed versions:
node --version
npm --version
1. Configure the frontend
Open a terminal in the project root:
cd frontend
npm install
Create a .env file in frontend/ using .env.example as a reference:
VITE_API_BASE_URL=http://localhost:3000
Start the frontend development server:
npm run dev
Vite normally serves the application at:
http://localhost:5173
2. Configure and start the Node.js backend
Open a second terminal from the project root:
cd Server
npm install
Create the gateway environment file at Server/api-gateway/.env using Server/api-gateway/.env.example as the reference. The example configures the gateway on port 3000 and the service URLs on ports 3001–`3007`.

Seed the catalog data:
npm run seed
Start the services:
npm start
The API Gateway is intended to be available at:
http://localhost:3000
Gateway health check:
http://localhost:3000/health
Stop the service manager with Ctrl+C.
Important repository setup note: In the supplied project archive, Server/start.js and Server/verify-all.js both expect Server/services/registration-service/src/server.js, but the registration-service directory is not present in that archive. The launcher therefore cannot start all eight processes successfully until that service is added or the launcher and gateway configuration are updated to match the implemented services. The registration service is listed above because the current service manager and gateway configuration expect it; its implementation could not be verified in the supplied folder.

Environment Variables
Frontend — frontend/.env
VITE_API_BASE_URL=http://localhost:3000
API Gateway — Server/api-gateway/.env
Start with the committed Server/api-gateway/.env.example:
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
EVENT_SERVICE_URL=http://localhost:3003
REGISTRATION_SERVICE_URL=http://localhost:3004
CLUB_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006
ANNOUNCEMENT_SERVICE_URL=http://localhost:3007
Keep local .env files and secrets out of version control. Use the .env.example files as templates and change demo credentials before any deployment.
API Overview
The API Gateway runs on http://localhost:3000. The gateway forwards API requests under /api/v1 to their respective services.
Method	Gateway endpoint	Purpose
GET	/health	API Gateway health check
POST	/api/v1/auth/register	Register a student or organizer
POST	/api/v1/auth/login	Authenticate and receive a JWT
GET	/api/v1/auth/me	Get the authenticated user's identity
GET	/api/v1/users/me	Get the user's profile
GET	/api/v1/events	List campus events
GET	/api/v1/clubs	List clubs
GET	/api/v1/categories	List categories
GET	/api/v1/announcements	List published announcements
GET	/api/v1/notifications/me	List the current user's notifications
GET	/api/v1/registrations/me	List the current user's registrations


The gateway also routes event-specific registration requests to the registration service:
/api/v1/events/:id/registrations
For request details and authorization rules, refer to the individual service route files under Server/services/*/src/routes.js.
Authentication and Demo Accounts
The service documentation provides the following demo accounts:
Role	Email	Password
Admin	admin@iiitvadodara.ac.in	admin123
Organizer	organizer@iiitvadodara.ac.in	organizer123
Student	student@iiitvadodara.ac.in	student123


Public registration is intended for student and organizer accounts. The admin account is seeded rather than publicly registered.
Security: These are development/demo credentials. Replace them and use secure secrets before deploying the application. Never commit real passwords, tokens or populated environment files.

Database
The Node.js services use SQLite through better-sqlite3. The service documentation and source tree show separate service-owned database files, including:
- auth.sqlite
- events.sqlite
- clubs.sqlite
- notifications.sqlite
- announcements.sqlite
Database files are runtime data and should not be committed as application source. The supplied archive also contains local database files and an older Python backend directory; the active Node.js backend described in this README is under Server/.
Scripts and Quality Checks
Run these commands from Server/:
Command	Purpose
npm install	Install backend workspace dependencies
npm run seed	Seed club/category and event catalog data
npm start	Start the service manager and API Gateway
npm run verify	Start services and run the end-to-end health verification script
npm run test:health	Run the health test script


Run these commands from frontend/:
Command	Purpose
npm install	Install frontend dependencies
npm run dev	Start the Vite development server
npm run lint	Run ESLint
npm run build	Create a production build
npm run preview	Preview the production build locally


The supplied archive includes Jest and Supertest as service development dependencies. Individual service test scripts are defined in the service package.json files; run npm test from a service directory that contains its tests.
The full backend verification command depends on all services expected by Server/start.js being present and runnable. See the registration-service setup note in Getting Started.

Documentation
Additional project documentation is available in:
- docs/SRS.md — Software Requirements Specification.
- docs/Development_plan.md — Development plan.
- Server/README.md — Backend microservices architecture and startup notes.
- Server/services/*/README.md — Service-specific notes.
Contributors
Name	GitHub Profile	Role
Shreya Verma	@vrmashreya	Contributor
Yogita Gothi	@yogitagothi2411	Contributor
Sonali Choudhary	@sonalichoudhary1101	Contributor
Janvi	@Janvi22-31	Contributor
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


## 👥 Contributors

| Name | GitHub Profile | Role |
|---|---|---|
| Shreya Verma | [@vrmashreya](https://github.com/vrmashreya) | Contributor |
| Yogita Gothi | [@yogitagothi2411](https://github.com/yogitagothi2411) | Contributor |
| Sonali Choudhary | [@sonalichoudhary1101](https://github.com/sonalichoudhary1101) | Contributor |
| Janvi | [@Janvi22-31](https://github.com/Janvi22-31) | Contributor |
