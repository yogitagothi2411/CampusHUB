# CampusEventHUB — team integration repository

Stack: React + Vite frontend, Node.js + Express microservices, SQLite (one database file per service). No Python/FastAPI, PostgreSQL or MongoDB in this selected configuration.

## Start after all four members commit/merge
Requirements: Node.js 20+. From repository root:

```bash
npm install
copy backend\api-gateway\.env.example backend\api-gateway\.env
copy backend\services\auth-service\.env.example backend\services\auth-service\.env
copy backend\services\user-service\.env.example backend\services\user-service\.env
copy backend\services\event-service\.env.example backend\services\event-service\.env
copy backend\services\registration-service\.env.example backend\services\registration-service\.env
copy backend\services\club-service\.env.example backend\services\club-service\.env
copy backend\services\notification-service\.env.example backend\services\notification-service\.env
copy backend\services\announcement-service\.env.example backend\services\announcement-service\.env
npm run dev
```

Frontend in a second terminal: `cd frontend && npm install && npm run dev`. Frontend API base URL: `http://localhost:3000/api/v1`.

## Ports
Gateway 3000; Auth 3001; User 3002; Event 3003; Registration 3004; Club 3005; Notification 3006; Announcement 3007.

## Demo credentials
`admin@iiitvadodara.ac.in / admin123`; `organizer@iiitvadodara.ac.in / organizer123`; `student@iiitvadodara.ac.in / student123`. Change all demo passwords and JWT_SECRET before deployment.

## Important integration contract
- All member branches must use the same `JWT_SECRET` and role strings: `student`, `organizer`, `admin`.
- Every service has `GET /health`.
- Gateway public base is `/api/v1`; services own the paths documented in `docs/API-CONTRACT.md`.
- JSON success: `{ success: true, message?, data }`; errors: `{ success: false, error: { code, message, details }, request_id? }`.
- Services own their SQLite file. A service must call another service over HTTP rather than opening its DB.
- Keep service folders and root workspace names unchanged when merging PRs.

## Git workflow
Each member works on their feature branch and opens a PR. Merge in this order: Member 1 foundation/gateway, Member 2 event+club, Member 3 registration, Member 4 communication. After all merges, pull `main`, run the root install and startup commands above, then test through the gateway.

## Notes
This is a team integration scaffold. Members should complete their assigned validation, pagination, ETag, cache, tests, OpenAPI/Swagger, GraphQL/SOAP and notification-event workflows as required by the course rubric. Do not claim those advanced evaluation items are complete until implemented and tested.
