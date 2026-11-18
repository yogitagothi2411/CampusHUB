# Shared API Contract

Gateway: `http://localhost:3000/api/v1`. All internal services expose `GET /health`.

## Auth / User (Member 1)
- POST `/auth/register` — student/organizer only; body `{name,email,password,role?}`.
- POST `/auth/login` — body `{email,password}`; returns `data.access_token`, `data.user`.
- GET `/auth/me` — Bearer token.
- GET `/users/me` — Bearer token.

## Events / Clubs / Categories (Member 2)
- GET `/events?category=&search=&timing=upcoming|completed&limit=` public.
- GET `/events/:id` public.
- POST `/events` organizer/admin.
- PUT/PATCH/DELETE `/events/:id` owner/admin.
- GET `/clubs`, GET `/clubs/:id` public; POST/PUT/DELETE `/clubs/:id?` admin.
- GET `/categories`, GET `/categories/:id` public; POST `/categories` admin.

## Registration (Member 3)
- POST `/events/:id/registrations` student; optional `Idempotency-Key` header.
- GET `/events/:id/registrations` organizer/admin.
- GET `/events/:id/registrations/me` student.
- DELETE `/events/:id/registrations/me` student.
- GET `/registrations/me` student.

## Communication (Member 4)
- GET `/announcements`, GET `/announcements/:id` public.
- POST/PUT/DELETE `/announcements` admin.
- GET `/notifications/me`, GET `/notifications/me/unread-count`, PATCH `/notifications/:id/read`, POST `/notifications/me/read-all` authenticated.

## Identity and errors
JWT payload: `sub` (user id), `role`, `email`, `name`. Header: `Authorization: Bearer <token>`. Roles exactly `student`, `organizer`, `admin`. Use HTTP 400 malformed input, 401 unauthenticated, 403 forbidden, 404 missing resource, 409 conflict, 422 validation, 429 rate limit, 500 unexpected error.
