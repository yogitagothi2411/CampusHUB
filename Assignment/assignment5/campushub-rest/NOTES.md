# CS543 Web Services — Assignment 5 — campusEventHUB

- Team ID: **FILL IN**
- Team members (roll number — full name): **FILL IN FOR EVERY MEMBER**
- GitHub repository URL: **FILL IN**

## Project fit

The uploaded CampusHUB project is a React/Vite event platform with student, organizer and admin views. Its existing backend has a FastAPI Event Service (`GET /events`, `GET /events/{event_id}`, `POST /events`). The frontend currently uses mock/local data. This Assignment 5 folder adds a separate registration REST service that validates event IDs through the existing Event Service. It is not yet wired into the React frontend. The service uses an in-memory store for this coursework; registrations reset on process restart.

## A1 — Method map

| Action | Method + URL | Safe | Idempotent | Success |
|---|---|---|---|---|
| Health check | GET `/health` | Yes | Yes | 200 |
| Search/list registrations | GET `/registrations?eventId=1&sort=id&order=asc&page=1&limit=10` | Yes | Yes | 200 |
| Create registration | POST `/registrations` | No | With same Idempotency-Key and same body, replay-safe | 201 + Location |
| Read registration | GET `/registrations/{id}` | Yes | Yes | 200; 304 when ETag matches |
| Replace editable registration field | PUT `/registrations/{id}` | No | Yes when same representation is supplied, subject to If-Match | 200 + new ETag |
| Modify editable registration field | PATCH `/registrations/{id}` | No | Not generally; this implementation sets the supplied studentReference to the same value | 200 + new ETag |
| Delete registration | DELETE `/registrations/{id}` | No | Intended effect is idempotent; repeated delete returns 404 after first delete | 204 |
| Discover supported methods | OPTIONS `/registrations` | Yes | Yes | 204 + Allow |

Non-CRUD actions should use POST sub-resources, e.g. a future cancellation action could be `POST /registrations/{id}/cancellation`; do not put verbs in URLs. `X-HTTP-Method-Override: DELETE` is documented for constrained clients, but the client should still use the normal DELETE method whenever possible.

## D2 — Headers table

| Endpoint | Request headers | Response headers / behavior |
|---|---|---|
| GET `/health` | Accept | Content-Type application/json; rate-limit headers; nosniff; HSTS |
| GET `/registrations` | Accept; query params for filter/sort/page/limit | Content-Type application/json; X-RateLimit-Limit; X-RateLimit-Remaining; CORS; nosniff; HSTS |
| POST `/registrations` | Content-Type, Accept, Idempotency-Key | 201, Location, ETag, Cache-Control no-store; rate-limit/security headers |
| GET `/registrations/{id}` | Accept; optional If-None-Match | ETag, Cache-Control private/revalidate; 304 with no body on match |
| PUT/PATCH `/registrations/{id}` | Authorization: Bearer token; If-Match; Content-Type, Accept | ETag on success; no-store; 401/412/428 on relevant failures |
| DELETE `/registrations/{id}` | Authorization: Bearer token; optional X-HTTP-Method-Override | 204 no body; no-store; security/rate-limit headers |
| OPTIONS `/registrations` | Browser preflight may include Origin, Access-Control-Request-Method and Access-Control-Request-Headers | Allow; CORS middleware answers browser preflight |
| Rate limit exceeded | Any API request | 429, Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining: 0 |

The framework normally supplies Date and Server headers. HSTS is included for the assignment, but production deployment must terminate HTTPS correctly; do not expose this development server directly to the public internet.

## C4 — Safe-retry plan

| Risky endpoint | Mechanism | Why |
|---|---|---|
| POST `/registrations` | Idempotency-Key | A timeout after creation could otherwise lead to duplicate registrations. Same key + same body replays the original result; same key + different body returns 409. |
| GET `/registrations/{id}` | If-None-Match | Avoids downloading an unchanged representation; 304 has no body. |
| PUT/PATCH `/registrations/{id}` | If-Match | Rejects stale edits with 412 and prevents one editor silently overwriting another editor's newer representation. |
| DELETE `/registrations/{id}` | HTTP idempotent intent + authorization | Repeating the intended deletion does not restore or duplicate data; this API returns 404 if the resource is already gone. |

## Eight written answers

### 1. Three endpoints, success status, important response header
- `POST /registrations`: 201 Created; `Location` points to the newly created registration so the client can retrieve it.
- `GET /registrations/{id}`: 200 OK; `ETag` identifies the current representation and enables conditional requests.
- `DELETE /registrations/{id}`: 204 No Content; the response has no body because the deletion succeeded.

### 2. Safe and idempotent endpoints
GET and OPTIONS are safe and idempotent. PUT and DELETE are not safe, but their intended effects are idempotent. POST is neither safe nor inherently idempotent. This implementation requires an `Idempotency-Key` for registration creation and replays the original result for a repeated key/body, preventing duplicate event registrations if a client retries after a timeout.

### 3. ETag, 304, and 412
First call `GET /registrations/1` and copy its ETag, for example the exact quoted value returned by your running server. Send `GET /registrations/1` with `If-None-Match: <that exact ETag>`; unchanged data returns 304 with no body, saving bandwidth. Send a PUT with `If-Match: "stale-tag"`; it returns 412 and prevents a stale editor from overwriting newer data. Use the real ETag from your run in the submission.

### 4. Exact 400 and 422 examples
400: `POST /registrations` with a valid JSON body but no `Idempotency-Key`; this endpoint explicitly requires the header. 422: `POST /registrations` with `Idempotency-Key: missing-event-1` and body `{"eventId":"999999","studentReference":"STU-1"}` when the Event Service says that event does not exist. 400 means the request/header is malformed or missing a required protocol input; 422 means the JSON is structurally valid but the requested domain operation cannot be accepted. FastAPI's default schema-validation response is 422.

### 5. Browser CORS block despite server 200
The browser enforces the same-origin policy and blocks JavaScript from reading a cross-origin response when the server does not permit that origin. Configure `Access-Control-Allow-Origin` for the frontend origin and answer OPTIONS preflight with the allowed methods and headers. CORS middleware is configured from `CORS_ORIGINS`.

### 6. Cacheable versus no-store
A single registration GET uses `Cache-Control: private, max-age=0, must-revalidate` and ETag so a private client can revalidate before reuse. Create/update/delete responses use `Cache-Control: no-store` because they are mutation results and should not be stored by caches. Authentication-related or sensitive personal responses should also use no-store where appropriate.

### 7. When POST is better than GET for search
Use POST for a complex search when criteria are large, nested, or sensitive enough that placing them in a URL is unsuitable. You give up the normal advantages of GET, including straightforward URL sharing/bookmarking, broad cacheability, and safe/idempotent semantics by default. This API keeps simple event filtering on GET query parameters.

### 8. Location on 201 versus 3xx
On 201 Created, `Location` identifies the newly created resource. On a 3xx redirect, `Location` identifies the URI the client should navigate to next.

## Evidence / final checklist

- [ ] Run `pytest -q` and keep the real result.
- [ ] Run all required `curl -v` scenarios against the local service and replace `curl-transcript.txt` with real output: 201, idempotent replay, 304, 412, 400, 404 and 401.
- [ ] Validate `openapi.yaml` in Swagger Editor; correct any validation errors.
- [ ] Fill Team ID, all roll numbers/names, and repository link.
- [ ] Commit the updated service folder, tests, `openapi.yaml`, transcript, and NOTES to the existing CampusHUB repository; submit one ZIP from the team leader.
