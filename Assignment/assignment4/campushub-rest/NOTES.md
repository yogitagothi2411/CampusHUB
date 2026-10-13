# CampusHUB REST Registration Service — Assignment 4

> **Before submission:** Replace every team placeholder below. Confirm that the instructor accepts CampusHUB as the domain adaptation; the supplied brief explicitly names CampusEats and permits Catalogue, Orders, or Delivery. The CampusHUB registration domain is our adaptation, not a verbatim option from the brief.

- Course: CS543 Web Services
- Assignment: 4 — REST service, OpenAPI contract, implementation and resilient outbound call
- Team ID: **REPLACE_WITH_TEAM_ID**
- Team members: **REPLACE_WITH_NAME_AND_ROLL_NO_FOR_EACH_MEMBER**
- Repository: **REPLACE_WITH_GITHUB_REPOSITORY_URL**

## A2–A4. Starting SOAP-style operations and REST resource table

Possible SOAP-style starting operations: `createRegistration(eventId, studentReference)`, `getRegistration(registrationId)`, `listRegistrations(eventId, status)`, and `cancelRegistration(registrationId)`.

| Method | URL | What it does | Success code | Failure codes |
|---|---|---|---:|---|
| POST | `/registrations` | Create an event registration; supports `Idempotency-Key` | 201; 200 for replay of same key | 400, 422, 503 |
| GET | `/registrations/{registration_id}` | Read one registration; supports ETag / `If-None-Match` | 200; 304 if unchanged | 404 |
| GET | `/registrations?eventId=...&status=...` | Filter the list using query parameters | 200 | 400 if future validation is added |
| POST | `/registrations/{registration_id}/cancellation` | State-changing sub-resource: cancel registration | 200 | 404, 409, 412 |
| GET | `/protected/demo` | Demonstrate required Bearer-header handling | 200 | 401 |
| OPTIONS | `/registrations` | Report supported methods using `Allow` | 204 | — |

## A5. Hard resource-design choice

Cancellation is an action rather than a simple noun, so a verb-only URL such as `/cancelRegistration` was rejected. The selected design uses `POST /registrations/{registration_id}/cancellation`, which makes cancellation a sub-resource of the registration and clearly identifies the registration affected. POST is appropriate because the request changes state and repeated cancellation can conflict with the existing state. The implementation returns 409 if the registration is already cancelled.

## B. Contract and validation

`openapi.yaml` is written before handler implementation and defines reusable request, response, list and problem schemas under `components.schemas`. The code's `validate_registration()` function validates the body before accessing its fields. The OpenAPI document is the published contract; it does not automatically validate requests at runtime.

## C. Model versus representation

The `Registration` dataclass is the stored model. `Registration.as_json()` is the public representation. The internal `idempotency_key` is deliberately not returned to API clients.

## D2. Outbound dependency and fallback

The service can call a separate CampusHUB event lookup service when `CAMPUSHUB_EVENT_SERVICE_URL` is configured. The value must be an environment variable and should contain `{event_id}`, for example `http://127.0.0.1:8001/events/{event_id}`. The implementation uses a timeout and up to three attempts with exponential backoff and jitter. It does not retry 4xx responses. If the dependency remains unreachable, the service fails closed with 503 and creates no registration, because accepting a registration for an event that cannot be verified could leave the student registered for a nonexistent or unavailable event. Without the environment variable, the service runs locally in demo mode and skips the dependency call; configure it for the outbound-call demonstration.

The included SOAP partner package is a **separate proposed integration design**. Its `.example` URL is a placeholder and must not be described as a live partner call. A SOAP mock can be used in tests until a real provider endpoint is supplied.

## Required Assignment 4 evidence

- `openapi.yaml`: contract for all listed endpoints and failure responses.
- `tests/`: pytest tests for create + Location, idempotent replay, 4xx failure, unknown ID, filtering, conflict, conditional GET and stale write.
- `curl-transcript.txt` at the project root: capture real output by following `CURL-TESTS.md`.
- OpenAPI validation: use https://editor.swagger.io/ or run `openapi-spec-validator openapi.yaml` after installing it. Save a screenshot or terminal output showing zero errors; do not claim validation passed until you run it.

## Notes answers — use your own Assignment 3 artefacts

The provided files in this workspace include a CampusHUB SMS partner WSDL, request, response and fault example. They do **not** establish that these files are the user's original Assignment 3 artefacts. Therefore, replace the marked parts below with exact quotations and line counts from your own Assignment 3 submission before handing in.

### 1. WSDL line count versus OpenAPI line count

Run `wc -l path/to/your-assignment3.wsdl campushub-rest/openapi.yaml` (on Windows PowerShell, use `(Get-Content path).Count`). Report both actual counts and explain the difference based on the files. WSDL commonly declares XML namespaces, messages, port types, bindings and service endpoints; OpenAPI describes HTTP paths, parameters, request/response media types and reusable schemas. Use two declarations that are actually present in your own WSDL for the final answer.

### 2. SOAP Fault and HTTP problem response

Paste an exact `soap:Fault` from your Assignment 3 artefact. The corresponding REST failure uses the appropriate HTTP status and the common body shape `{"type":"about:blank","title":"Dependency Unavailable","status":503,"detail":"The event service could not be reached; no registration was created."}` for a dependency outage. An error hidden inside HTTP 200 is misleading because intermediaries and clients may treat the HTTP exchange as successful, preventing normal status-based monitoring, retry and error handling.

### 3. UDDI publish, find, bind

In a REST/OpenAPI deployment, publishing may be handled by publishing the API specification in a repository or API catalogue; finding can be done through repository search or documentation; binding is usually performed by the client using the API base URL and HTTP contract. A separate UDDI registry is not automatically present. Explain the actual deployment mechanism used by your project.

### 4. XML Schema validation versus runtime validation

The function `validate_registration()` in `models.py` validates the JSON body before handler code accesses the fields. Without it, a missing `eventId`, a non-object JSON body, or a non-string field could cause invalid data to be stored or an avoidable server error.

### 5. When SOAP may still be preferable

SOAP may be preferable when integrating with a partner whose formal contract requires WSDL/XSD, SOAP headers and standardized SOAP Faults. The guarantee being purchased is contract-driven XML message structure and explicit operation/binding definitions; additional WS-* guarantees only exist if the relevant extensions are actually configured. Do not claim those extra guarantees for this sample alone.

## Run locally

From this folder:

```bash
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

In a second terminal, run `pytest -q`. This service uses in-memory storage, so registrations reset when the process restarts.
