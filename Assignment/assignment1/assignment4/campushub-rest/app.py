import os
import time
import random
import hashlib
import json
import requests
from fastapi import FastAPI, Request, Header, Query, Response
from fastapi.responses import JSONResponse
from models import validate_registration
from store import store
from errors import problem

app = FastAPI(title="CampusHUB Registration API", version="1.0.0", description="REST API for campus event registrations.")

# Simple in-process rate budget for this teaching assignment.
_rate = {}
RATE_LIMIT = int(os.getenv("RATE_LIMIT", "60"))

@app.middleware("http")
async def common_headers(request: Request, call_next):
    client = request.client.host if request.client else "unknown"
    now = int(time.time() // 60)
    bucket = _rate.setdefault((client, now), 0)
    if bucket >= RATE_LIMIT:
        return JSONResponse(status_code=429, content={"type":"about:blank","title":"Too Many Requests","status":429,"detail":"Client request budget exceeded."}, headers={"Retry-After":"60", "X-RateLimit-Limit":str(RATE_LIMIT), "X-RateLimit-Remaining":"0"}, media_type="application/problem+json")
    _rate[(client, now)] = bucket + 1
    response = await call_next(request)
    response.headers.setdefault("X-RateLimit-Limit", str(RATE_LIMIT))
    response.headers.setdefault("X-RateLimit-Remaining", str(max(0, RATE_LIMIT - _rate[(client, now)])))
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Access-Control-Allow-Origin", os.getenv("CORS_ALLOW_ORIGIN", "*"))
    response.headers.setdefault("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.setdefault("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key, If-None-Match, If-Match")
    response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

@app.options("/registrations")
@app.options("/registrations/{registration_id}")
def options_registrations():
    return Response(status_code=204, headers={"Allow":"GET, POST, OPTIONS"})

@app.get("/health")
def health():
    return {"status":"ok", "service":"CampusHUB Registration API"}

@app.post("/registrations", status_code=201)
async def create_registration(request: Request, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    try:
        body = await request.json()
    except Exception:
        return problem(400, "Bad Request", "Body must contain valid JSON.")
    error = validate_registration(body)
    if error:
        return problem(400, "Bad Request", error)
    # Optional real outbound HTTP dependency. If configured, it must be reachable before a registration is accepted.
    # URL is supplied through CAMPUSHUB_EVENT_SERVICE_URL, e.g. http://localhost:8001/events/{event_id}.
    event_url_template = os.getenv("CAMPUSHUB_EVENT_SERVICE_URL")
    if event_url_template:
        event_url = event_url_template.replace("{event_id}", body["eventId"])
        last_error = None
        for attempt in range(3):
            try:
                dep = requests.get(event_url, timeout=1.5)
                if 400 <= dep.status_code < 500:
                    return problem(422, "Event Refused", "The event service rejected this event reference.")
                dep.raise_for_status()
                last_error = None
                break
            except requests.RequestException as exc:
                last_error = exc
                if attempt < 2:
                    time.sleep((0.1 * (2 ** attempt)) + random.uniform(0, 0.05))
        if last_error:
            return problem(503, "Dependency Unavailable", "The event service could not be reached; no registration was created.")
    item, created = store.create(body["eventId"].strip(), body["studentReference"].strip(), idempotency_key)
    # Repeat of same key returns original representation and does not create a second record.
    return JSONResponse(status_code=201 if created else 200, content=item.as_json(), headers={"Location":f"/registrations/{item.registration_id}", "Cache-Control":"no-store"})

@app.get("/registrations")
def list_registrations(event_id: str | None = Query(default=None, alias="eventId"), status: str | None = None):
    items = store.list(event_id=event_id, status=status)
    return {"items":[x.as_json() for x in items], "count":len(items)}

@app.get("/registrations/{registration_id}")
def get_registration(registration_id: str, request: Request, response: Response):
    item = store.get(registration_id)
    if item is None:
        return problem(404, "Not Found", f"Registration '{registration_id}' was not found.")
    body = item.as_json()
    tag = '"' + hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16] + '"'
    response.headers["ETag"] = tag
    response.headers["Cache-Control"] = "private, max-age=30, must-revalidate"
    if request.headers.get("if-none-match") == tag:
        return Response(status_code=304, headers={"ETag":tag, "Cache-Control":"private, max-age=30, must-revalidate"})
    return body

@app.post("/registrations/{registration_id}/cancellation")
def cancel_registration(registration_id: str, if_match: str | None = Header(default=None, alias="If-Match")):
    item = store.get(registration_id)
    if item is None:
        return problem(404, "Not Found", f"Registration '{registration_id}' was not found.")
    current = '"' + hashlib.sha256(json.dumps(item.as_json(), sort_keys=True).encode()).hexdigest()[:16] + '"'
    if if_match is not None and if_match != current:
        return problem(412, "Precondition Failed", "The registration changed; fetch it again before retrying.")
    item, result = store.cancel(registration_id)
    if result == "conflict":
        return problem(409, "Conflict", "The registration is already cancelled.")
    return JSONResponse(status_code=200, content=item.as_json(), headers={"Cache-Control":"no-store"})

@app.get("/protected/demo")
def protected_demo(authorization: str | None = Header(default=None, alias="Authorization")):
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        return problem(401, "Unauthorized", "Provide Authorization: Bearer <token>.")
    return {"message":"Header accepted for assignment demonstration; token is not verified."}
