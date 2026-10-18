# CampusHUB Microservices Server Architecture

A distributed microservice backend powered by Node.js and an API Gateway with reverse-proxying.

## Architecture

| Service | Port | Description | Database / Storage |
|---|---|---|---|
| **API Gateway** | `3000` | Central gateway & reverse proxy with rate limiting | In-memory / Upstream proxy |
| **Auth Service** | `3001` | User registration, login, JWT issuance, identity | `auth.sqlite` |
| **User Service** | `3002` | User profiles, student/organizer directory | Inter-service via Auth Service |
| **Event Service** | `3003` | Event catalog, creation, updates, and filtering | `events.sqlite` |
| **Registration Service** | `3004` | Event registration, ticket generation, capacity | `registrations.sqlite` |
| **Club Service** | `3005` | Clubs and category catalog | `clubs.sqlite` |
| **Notification Service** | `3006` | In-app notifications & unread counts | `notifications.sqlite` |
| **Announcement Service** | `3007` | College-wide broadcast announcements | `announcements.sqlite` |

---

## Quick Start

### 1. Install Dependencies
From the `Server` directory:
```bash
npm install
```

### 2. Seed Databases (Clubs, Categories, Events)
```bash
npm run seed
```

### 3. Run All Services & Gateway
```bash
npm start
```
All 8 services will start concurrently, and the API Gateway will be available at:
`http://localhost:3000`

### 4. Verify End-to-End Health & APIs
To automatically start all services, test direct `/health` endpoints, verify gateway routing, test user authentication, and shut down cleanly:
```bash
npm run verify
```

---

## Seeded Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@iiitvadodara.ac.in` | `admin123` |
| **Organizer** | `organizer@iiitvadodara.ac.in` | `organizer123` |
| **Student** | `student@iiitvadodara.ac.in` | `student123` |

---

## Key Gateway Endpoints (`http://localhost:3000`)

- `GET  /health` - Gateway health check
- `POST /api/v1/auth/login` - Login with email & password
- `POST /api/v1/auth/register` - Register a student or organizer
- `GET  /api/v1/auth/me` - Authenticated user info
- `GET  /api/v1/users/me` - User profile
- `GET  /api/v1/events` - List campus events
- `GET  /api/v1/clubs` - List campus clubs
- `GET  /api/v1/categories` - List event/club categories
- `GET  /api/v1/announcements` - List published announcements
- `GET  /api/v1/notifications/me` - List user notifications
- `GET  /api/v1/registrations/me` - List user event registrations
