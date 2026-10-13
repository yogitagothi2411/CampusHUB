# Assignment 6 — Honest Responses: Status Codes, Errors & Validation

**Project:** campusEventHUB / CampusHUB Registration Service  
**Base:** Assignment 5 registration REST service (same service; no new service)  
**Team Leader:** Yogita — 20251651107

**Team Members:**
- Yogita (Team Leader) — 20251651107
- Janvi — 20251651047
- Shreya Verma — 20251651086
- Sonali — 20251651088

## 1. Status map

| Endpoint | Success | Failure statuses and reason |
|---|---|---|
| `GET /health` | `200` health representation | `406` if the client asks for an unsupported representation; `429` if rate-limited. |
| `GET /registrations` | `200` paginated/filterable list | `422` invalid query fields; `406` unsupported `Accept`; `429` rate limit. |
| `POST /registrations` | `201 Created`, body plus `Location: /registrations/{id}` | `400` missing idempotency key or malformed JSON; `409` same key reused with a different body; `422` invalid fields or referenced event rejected/not found; `429` rate limit; `503` event service unavailable (includes `Retry-After`). |
| `GET /registrations/{registration_id}` | `200`; `304` if `If-None-Match` matches | `404` registration absent; `406` unsupported `Accept`; `429` rate limit. |
| `PUT /registrations/{registration_id}` | `200` updated representation | `400` malformed input; `401` missing/invalid bearer token; `404` unknown registration; `412` stale `If-Match`; `422` field validation; `428` missing `If-Match`; `406` unsupported `Accept`; `429` rate limit. |
| `PATCH /registrations/{registration_id}` | `200` updated representation | Same failures as PUT; this API's PATCH currently accepts the same update model as PUT. |
| `DELETE /registrations/{registration_id}` | `204 No Content` | `400` invalid method-override header; `401` missing/invalid bearer token; `404` unknown registration; `429` rate limit. |
| `OPTIONS /registrations` | `204 No Content` with `Allow` | `429` rate limit. |

Every failure uses the Problem Details shape, except `204`/`304` which intentionally have no response body. Malformed JSON is `400`; syntactically valid JSON failing model validation is `422`.

## 2. Stable problem type catalogue

Types are stable URI suffixes under `https://campushub.example/problems/`:

- `registration-not-found` — requested registration ID does not exist.
- `event-not-found` — event service confirms the referenced event does not exist; returned as `422` because the registration payload's event reference is invalid.
- `event-service-rejected` — event service rejects the event reference for another client-side reason (`422`).
- `event-service-unavailable` — event service times out or is unavailable after bounded retries (`503`, `Retry-After: 2`).
- `idempotency-key-required` — missing `Idempotency-Key` on creation (`400`).
- `idempotency-conflict` — an existing idempotency key is reused with a different payload (`409`).
- `authentication-required` — bearer token absent or invalid (`401`).
- `precondition-required` — update omitted `If-Match` (`428`).
- `precondition-failed` — `If-Match` does not equal current ETag (`412`).
- `invalid-request` — field/query validation failed (`422`).
- `rate-limit-exceeded` — request limit exceeded (`429`, `Retry-After: 60`).
- `not-acceptable` — no supported representation matches `Accept` (`406`).
- `bad-request` — malformed JSON, missing idempotency key, or invalid method override (`400`).
- `internal-error` — unexpected server-side exception (`500`); implementation details are logged, not returned.

The instructor's sample types (`empty-cart`, `item-unavailable`, `payment-declined`, `order-not-found`, `illegal-transition`) describe an Orders domain and do not apply to this Registration Service. This submission uses stable types for the actual CampusHUB registration domain rather than pretending it contains orders, carts, or payments.

## 3. Example Problem Details body (404)

```json
{
  "type": "https://campushub.example/problems/registration-not-found",
  "title": "Registration not found",
  "status": 404,
  "detail": "Registration not found."
}
```

- `type`: stable URI identifying the problem category.
- `title`: short human-readable summary.
- `status`: HTTP status code, matching the response status.
- `detail`: safe explanation for this occurrence.

Response content type: `application/problem+json; charset=utf-8` (or XML Problem Details when the request explicitly accepts only XML).

## 4. Field-level 422 with two invalid fields

Request:

```http
POST /registrations
Idempotency-Key: bad-fields
Content-Type: application/json

{"eventId":"", "studentReference":""}
```

Response status: `422 Unprocessable Entity`. The `errors` array includes an entry for `eventId` and one for `studentReference`; each item has `field` and `reason`. Exact wording can vary slightly with the installed Pydantic version.

```json
{
  "type": "https://campushub.example/problems/invalid-request",
  "title": "Request validation failed",
  "status": 422,
  "detail": "One or more fields failed validation.",
  "errors": [
    {"field":"eventId", "reason":"String should have at least 1 character"},
    {"field":"studentReference", "reason":"String should have at least 1 character"}
  ]
}
```

## 5. Retry safety

- `POST /registrations`: retry only with the **same** `Idempotency-Key` and identical body. A replay returns the original result and does not create a duplicate. Do not retry a `4xx` unchanged; fix the request first. For `503`, wait according to `Retry-After` and reuse the same key/body.
- `GET /registrations`, `GET /registrations/{id}`, and `GET /health`: safe to retry for transient failures such as `503`; `429` says to wait `Retry-After` seconds.
- `PUT`/`PATCH`: retry only after re-fetching the current ETag and resolving `412`; stale preconditions are not blindly retryable. These methods require authentication and `If-Match`.
- `DELETE`: because the service returns `404` after the resource is gone, do not blindly repeat after an uncertain outcome; first GET the resource to confirm state. A transient `503` can be retried after waiting if the client can tolerate checking the resulting state.
- `429` includes `Retry-After: 60`; `503` from the event dependency includes `Retry-After: 2`.

## 6. Internal error mapping and information hiding

`verify_event()` catches request-library network errors, logs only the exception class and attempt server-side, retries a bounded number of times, and maps final failure to `503 event-service-unavailable`. The global exception handler logs the exception and stack trace to server logs but returns only a generic `500 internal-error` detail. Raw stack traces, database messages, internal URLs, and exception text are not returned to callers.

## 7. JSON and XML negotiation

`Accept: application/json` (or the default) returns JSON with `Content-Type: application/json; charset=utf-8`. `Accept: application/xml` returns XML with `Content-Type: application/xml; charset=utf-8`. An unsupported value such as `Accept: image/png` returns `406` with a Problem Details body. Example curl commands and representative output are in `transcript.txt`.

## Validation schema for POST /registrations

The existing registration model requires `eventId` and `studentReference`, both non-empty strings up to 100 characters; unknown fields are rejected. The service validates the body before event lookup or storage changes and reports all Pydantic field errors together in one `422` response. This is the Registration Service's equivalent of the assignment's sample order-body schema.
