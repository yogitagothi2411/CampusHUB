import hashlib, json, os, time, gzip
from collections import defaultdict
from threading import Lock
import requests
from fastapi import FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import request_validation_exception_handler
from models import RegistrationCreate, RegistrationUpdate, Registration
from store import store

app = FastAPI(
    title="campusEventHUB Registration Service",
    version="1.1.0",
    description="Assignment 4/5 registration REST API, integrated with CampusHUB Event Service."
)
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"],
                   allow_headers=["Authorization","Content-Type","Accept","If-Match","If-None-Match",
                                  "Idempotency-Key","X-HTTP-Method-Override"])

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # Malformed JSON is a syntax error (400); valid JSON that violates the schema is 422.
    if any(err.get("type") == "json_invalid" for err in exc.errors()):
        return JSONResponse({"detail": "Malformed JSON request body."}, status_code=400)
    return await request_validation_exception_handler(request, exc)
EVENT_URL = os.getenv("CAMPUSHUB_EVENT_SERVICE_URL", "http://127.0.0.1:8001/events/{event_id}")
TOKEN = os.getenv("API_BEARER_TOKEN", "campushub-demo-token")
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
rate_counts = defaultdict(list)
rate_lock = Lock()

@app.middleware("http")
async def common_headers_and_limits(request: Request, call_next):
    client = request.client.host if request.client else "unknown"
    now = time.time()
    with rate_lock:
        rate_counts[client] = [t for t in rate_counts[client] if now - t < 60]
        remaining = max(0, RATE_LIMIT - len(rate_counts[client]))
        limited = len(rate_counts[client]) >= RATE_LIMIT and request.url.path != "/health"
        if not limited:
            rate_counts[client].append(now)
            remaining = max(0, RATE_LIMIT - len(rate_counts[client]))
    if limited:
        return JSONResponse({"detail":"Rate limit exceeded."}, status_code=429,
            headers={"Retry-After":"60","X-RateLimit-Limit":str(RATE_LIMIT),
                     "X-RateLimit-Remaining":"0","Cache-Control":"no-store",
                     "X-Content-Type-Options":"nosniff","Strict-Transport-Security":"max-age=31536000; includeSubDomains"})
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if request.url.path.startswith("/registrations") and request.method != "GET":
        response.headers["Cache-Control"] = "no-store"
    return response

@app.middleware("http")
async def accept_and_gzip(request: Request, call_next):
    accept = request.headers.get("accept", "*/*")
    if "application/json" not in accept and "*/*" not in accept:
        return JSONResponse({"detail":"Only application/json is supported."}, status_code=406,
                            headers={"Cache-Control":"no-store"})
    response = await call_next(request)
    body = getattr(response, "body", b"")
    if body and len(body) >= 1000 and "gzip" in request.headers.get("accept-encoding", "") and response.status_code not in (204,304):
        response.body = gzip.compress(body)
        response.headers["Content-Encoding"] = "gzip"
        response.headers["Content-Length"] = str(len(response.body))
    return response

def require_bearer(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        raise HTTPException(status_code=401, detail="A non-empty Bearer token is required.",
                            headers={"WWW-Authenticate":"Bearer"})
    if authorization[7:] != TOKEN:
        raise HTTPException(status_code=401, detail="Invalid Bearer token.",
                            headers={"WWW-Authenticate":"Bearer"})

def etag_for(item):
    raw = json.dumps(item.model_dump(), sort_keys=True, separators=(",", ":")).encode()
    return '"' + hashlib.sha256(raw).hexdigest()[:16] + '"'

def verify_event(event_id: str):
    url = EVENT_URL.replace("{event_id}", event_id)
    for attempt in range(3):
        try:
            r = requests.get(url, timeout=1.5)
            if r.status_code == 404:
                raise HTTPException(422, "The referenced event does not exist.")
            if 400 <= r.status_code < 500:
                raise HTTPException(422, "The Event Service rejected the event reference.")
            r.raise_for_status()
            return
        except HTTPException:
            raise
        except requests.RequestException:
            if attempt < 2:
                time.sleep(0.05 * (2 ** attempt))
    raise HTTPException(503, "Event Service unavailable; no registration was created.")

@app.get("/health", tags=["Health"])
def health():
    return {"status":"ok","service":"campusEventHUB Registration Service"}

@app.get("/registrations", tags=["Registrations"])
def list_registrations(event_id: str | None = Query(None, alias="eventId"),
                       sort: str = Query("id", pattern="^(id|eventId|studentReference|status)$"),
                       order: str = Query("asc", pattern="^(asc|desc)$"),
                       page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100)):
    items = list(store.items.values())
    if event_id is not None:
        items = [x for x in items if x.eventId == event_id]
    items.sort(key=lambda x: getattr(x, sort), reverse=(order == "desc"))
    start = (page - 1) * limit
    return {"items":[x.model_dump() for x in items[start:start+limit]], "count":len(items),
            "page":page, "limit":limit}

@app.post("/registrations", status_code=201, tags=["Registrations"])
def create_registration(payload: RegistrationCreate, idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(400, "Idempotency-Key header is required for registration creation.")
    with store.lock:
        if idempotency_key in store.idempotency:
            previous = store.idempotency[idempotency_key]
            if previous["payload"] != payload.model_dump():
                raise HTTPException(409, "Idempotency-Key was already used with a different request body.")
            return JSONResponse(status_code=previous["status"], content=previous["body"],
                                headers={"Location":previous["location"],"Idempotency-Replayed":"true","Cache-Control":"no-store"})
    verify_event(payload.eventId)
    with store.lock:
        # Recheck after outbound call to protect concurrent retries.
        if idempotency_key in store.idempotency:
            previous = store.idempotency[idempotency_key]
            if previous["payload"] != payload.model_dump():
                raise HTTPException(409, "Idempotency-Key was already used with a different request body.")
            return JSONResponse(status_code=previous["status"], content=previous["body"],
                                headers={"Location":previous["location"],"Idempotency-Replayed":"true","Cache-Control":"no-store"})
        item = Registration(id=str(store.next_id), eventId=payload.eventId,
                            studentReference=payload.studentReference, status="CONFIRMED")
        store.next_id += 1
        store.items[item.id] = item
        location = f"/registrations/{item.id}"
        body = item.model_dump()
        store.idempotency[idempotency_key] = {"payload":payload.model_dump(),"status":201,"body":body,"location":location}
    return JSONResponse(status_code=201, content=body, headers={"Location":location,"ETag":etag_for(item),"Cache-Control":"no-store"})

@app.get("/registrations/{registration_id}", tags=["Registrations"])
def get_registration(registration_id: str, if_none_match: str | None = Header(None, alias="If-None-Match")):
    item = store.items.get(registration_id)
    if item is None:
        raise HTTPException(404, "Registration not found.")
    tag = etag_for(item)
    headers = {"ETag":tag,"Cache-Control":"private, max-age=0, must-revalidate"}
    if if_none_match and if_none_match.strip() == tag:
        return Response(status_code=304, headers=headers)
    return JSONResponse(status_code=200, content=item.model_dump(), headers=headers)

@app.put("/registrations/{registration_id}", tags=["Registrations"])
def replace_registration(registration_id: str, payload: RegistrationUpdate,
                         if_match: str | None = Header(None, alias="If-Match"),
                         authorization: str | None = Header(None, alias="Authorization")):
    require_bearer(authorization)
    item = store.items.get(registration_id)
    if item is None:
        raise HTTPException(404, "Registration not found.")
    current = etag_for(item)
    if not if_match:
        raise HTTPException(428, "If-Match is required for updates.")
    if if_match != current:
        raise HTTPException(412, "ETag does not match current representation.")
    updated = Registration(id=item.id,eventId=item.eventId,studentReference=payload.studentReference,status=item.status)
    store.items[registration_id] = updated
    return JSONResponse(status_code=200, content=updated.model_dump(),
                        headers={"ETag":etag_for(updated),"Cache-Control":"no-store"})

@app.patch("/registrations/{registration_id}", tags=["Registrations"])
def patch_registration(registration_id: str, payload: RegistrationUpdate,
                       if_match: str | None = Header(None, alias="If-Match"),
                       authorization: str | None = Header(None, alias="Authorization")):
    return replace_registration(registration_id, payload, if_match, authorization)

@app.delete("/registrations/{registration_id}", status_code=204, tags=["Registrations"])
def delete_registration(registration_id: str,
                        authorization: str | None = Header(None, alias="Authorization"),
                        x_http_method_override: str | None = Header(None, alias="X-HTTP-Method-Override")):
    require_bearer(authorization)
    if x_http_method_override and x_http_method_override.upper() != "DELETE":
        raise HTTPException(400, "X-HTTP-Method-Override must be DELETE for this operation.")
    if registration_id not in store.items:
        raise HTTPException(404, "Registration not found.")
    del store.items[registration_id]
    return Response(status_code=204, headers={"Cache-Control":"no-store"})

@app.options("/registrations", include_in_schema=True, tags=["Registrations"])
def registration_options():
    return Response(status_code=204, headers={"Allow":"GET, POST, OPTIONS"})
