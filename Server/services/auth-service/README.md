# Member 1 — Auth + Identity
Port: 3001. Owns `auth.sqlite`.

Run `npm install` at repository root, then `npm run dev:auth`. Health: `GET /health`.

Endpoints: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`. Internal identity endpoints are consumed by the user service/gateway and must not be exposed publicly. Public registration only allows student and organizer; admin is seeded.

Demo credentials: admin@iiitvadodara.ac.in / admin123; organizer@iiitvadodara.ac.in / organizer123; student@iiitvadodara.ac.in / student123. Change these before deployment.
