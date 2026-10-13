"""CampusHUB Registration REST API — Assignment 6 honest errors and validation."""
import hashlib, json, logging, os, time, gzip
from collections import defaultdict
from threading import Lock
from xml.etree.ElementTree import Element, SubElement, tostring
import requests
from fastapi import FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response as FastAPIResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from models import RegistrationCreate, RegistrationUpdate, Registration
from store import store

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("campushub.registrations")
app = FastAPI(title="campusEventHUB Registration Service", version="1.2.0",
              description="CampusHUB event registration API with consistent Problem Details errors.")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"],
                   allow_headers=["Authorization","Content-Type","Accept","If-Match","If-None-Match","Idempotency-Key","X-HTTP-Method-Override"])
EVENT_URL = os.getenv("CAMPUSHUB_EVENT_SERVICE_URL", "http://127.0.0.1:8001/events/{event_id}")
TOKEN = os.getenv("API_BEARER_TOKEN", "campushub-demo-token")
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
rate_counts = defaultdict(list)
rate_lock = Lock()

ERRORS = {
 "registration-not-found": ("Registration not found", 404),
 "event-not-found": ("Referenced event does not exist", 422),
 "event-service-unavailable": ("Event service unavailable", 503),
 "idempotency-conflict": ("Idempotency key conflict", 409),
 "idempotency-key-required": ("Idempotency key required", 400),
 "authentication-required": ("Authentication required", 401),
 "precondition-required": ("If-Match required", 428),
 "precondition-failed": ("Representation changed", 412),
 "invalid-request": ("Request validation failed", 422),
 "rate-limit-exceeded": ("Rate limit exceeded", 429),
 "not-acceptable": ("No acceptable representation available", 406),
 "bad-request": ("Bad request", 400),
 "internal-error": ("Internal server error", 500),
 "event-service-rejected": ("Event reference rejected", 422),
}

def problem(status: int, type_name: str, detail: str, *, errors=None, headers=None, request: Request | None=None):
    title = ERRORS.get(type_name, ("Request failed", status))[0]
    body = {"type": f"https://campushub.example/problems/{type_name}", "title": title,
            "status": status, "detail": detail}
    if errors is not None: body["errors"] = errors
    accept = request.headers.get("accept", "application/json") if request else "application/json"
    if "application/xml" in accept and "application/json" not in accept:
        content = xml_document("problem", body)
        media = "application/xml; charset=utf-8"
    else:
        content = json.dumps(body, ensure_ascii=False)
        media = "application/problem+json; charset=utf-8"
    h = dict(headers or {})
    h["Content-Type"] = media
    h.setdefault("Cache-Control", "no-store")
    return Response(content=content, status_code=status, headers=h, media_type=None)

def xml_document(root_name, value):
    root = Element(root_name)
    def add(parent, key, val):
        if isinstance(val, dict):
            node = SubElement(parent, key)
            for k, v in val.items(): add(node, k, v)
        elif isinstance(val, list):
            node = SubElement(parent, key)
            for item in val: add(node, "item", item)
        else:
            node = SubElement(parent, key); node.text = "" if val is None else str(val)
    if isinstance(value, dict):
        for k, v in value.items(): add(root, k, v)
    else: root.text = str(value)
    return b'<?xml version="1.0" encoding="utf-8"?>' + tostring(root, encoding="utf-8")

def json_or_xml(request: Request, data, status=200, headers=None):
    accept = request.headers.get("accept", "application/json")
    if "application/xml" in accept and "application/json" not in accept:
        return Response(content=xml_document("response", data), status_code=status,
                        headers={**(headers or {}), "Content-Type":"application/xml; charset=utf-8"})
    if "application/json" not in accept and "*/*" not in accept:
        return problem(406, "not-acceptable", "Supported response formats are application/json and application/xml.", request=request)
    return JSONResponse(content=data, status_code=status, headers=headers, media_type="application/json; charset=utf-8")

@app.middleware("http")
async def common_headers_and_limits(request: Request, call_next):
    client = request.client.host if request.client else "unknown"
    now = time.time()
    with rate_lock:
        rate_counts[client] = [t for t in rate_counts[client] if now - t < 60]
        limited = len(rate_counts[client]) >= RATE_LIMIT and request.url.path != "/health"
        if not limited: rate_counts[client].append(now)
        remaining = max(0, RATE_LIMIT - len(rate_counts[client]))
    if limited:
        return problem(429, "rate-limit-exceeded", "Too many requests. Retry after the indicated delay.",
                       headers={"Retry-After":"60", "X-RateLimit-Limit":str(RATE_LIMIT), "X-RateLimit-Remaining":"0"}, request=request)
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if request.url.path.startswith("/registrations") and request.method != "GET": response.headers["Cache-Control"] = "no-store"
    if response.status_code == 503: response.headers.setdefault("Retry-After", "2")
    return response

@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    mapping = {400:"bad-request",401:"authentication-required",404:"registration-not-found",409:"idempotency-conflict",412:"precondition-failed",422:"invalid-request",428:"precondition-required",429:"rate-limit-exceeded",503:"event-service-unavailable"}
    detail = str(exc.detail) if isinstance(exc.detail, str) else "The request could not be completed."
    type_name = (exc.headers or {}).get("X-Problem-Type") or mapping.get(exc.status_code, "bad-request" if exc.status_code < 500 else "internal-error")
    safe_headers = {k:v for k,v in (exc.headers or {}).items() if k.lower() != "x-problem-type"}
    return problem(exc.status_code, type_name, detail, headers=safe_headers, request=request)

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    if any(e.get("type") == "json_invalid" for e in exc.errors()):
        return problem(400, "bad-request", "Malformed JSON request body.", request=request)
    errors=[]
    for e in exc.errors():
        loc = [str(x) for x in e.get("loc", []) if x not in ("body", "query", "path", "header")]
        errors.append({"field": ".".join(loc) or "request", "reason": e.get("msg", "Invalid value")})
    return problem(422, "invalid-request", "One or more fields failed validation.", errors=errors, request=request)

@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled request error at %s %s", request.method, request.url.path)
    return problem(500, "internal-error", "The server could not complete the request. Contact support with the request time.", request=request)

def require_bearer(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        raise HTTPException(401, "A non-empty Bearer token is required.", headers={"WWW-Authenticate":"Bearer"})
    if authorization[7:] != TOKEN:
        raise HTTPException(401, "Invalid Bearer token.", headers={"WWW-Authenticate":"Bearer"})

def etag_for(item):
    raw = json.dumps(item.model_dump(), sort_keys=True, separators=(",", ":")).encode()
    return '"' + hashlib.sha256(raw).hexdigest()[:16] + '"'

def verify_event(event_id: str):
    url = EVENT_URL.replace("{event_id}", event_id)
    for attempt in range(3):
        try:
            r = requests.get(url, timeout=1.5)
            if r.status_code == 404: raise HTTPException(422, "The referenced event does not exist.", headers={"X-Problem-Type":"event-not-found"})
            if 400 <= r.status_code < 500: raise HTTPException(422, "The Event Service rejected the event reference.", headers={"X-Problem-Type":"event-service-rejected"})
            r.raise_for_status(); return
        except HTTPException: raise
        except requests.RequestException as exc:
            logger.warning("Event Service attempt %s failed: %s", attempt + 1, type(exc).__name__)
            if attempt < 2: time.sleep(0.05 * (2 ** attempt))
    raise HTTPException(503, "Event Service unavailable; no registration was created.", headers={"Retry-After":"2"})

@app.get("/health", tags=["Health"])
def health(request: Request): return json_or_xml(request, {"status":"ok","service":"campusEventHUB Registration Service"})

@app.get("/registrations", tags=["Registrations"])
def list_registrations(request: Request, event_id: str | None = Query(None, alias="eventId"),
                       sort: str = Query("id", pattern="^(id|eventId|studentReference|status)$"),
                       order: str = Query("asc", pattern="^(asc|desc)$"), page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100)):
    items = list(store.items.values())
    if event_id is not None: items = [x for x in items if x.eventId == event_id]
    items.sort(key=lambda x: getattr(x, sort), reverse=(order == "desc"))
    start=(page-1)*limit
    return json_or_xml(request, {"items":[x.model_dump() for x in items[start:start+limit]],"count":len(items),"page":page,"limit":limit})

@app.post("/registrations", status_code=201, tags=["Registrations"])
def create_registration(request: Request, payload: RegistrationCreate, idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip(): raise HTTPException(400, "Idempotency-Key header is required for registration creation.", headers={"X-Problem-Type":"idempotency-key-required"})
    with store.lock:
        if idempotency_key in store.idempotency:
            previous=store.idempotency[idempotency_key]
            if previous["payload"] != payload.model_dump(): raise HTTPException(409, "Idempotency-Key was already used with a different request body.")
            return json_or_xml(request, previous["body"], previous["status"], {"Location":previous["location"],"Idempotency-Replayed":"true","Cache-Control":"no-store"})
    verify_event(payload.eventId)
    with store.lock:
        if idempotency_key in store.idempotency:
            previous=store.idempotency[idempotency_key]
            if previous["payload"] != payload.model_dump(): raise HTTPException(409, "Idempotency-Key was already used with a different request body.")
            return json_or_xml(request, previous["body"], previous["status"], {"Location":previous["location"],"Idempotency-Replayed":"true","Cache-Control":"no-store"})
        item=Registration(id=str(store.next_id),eventId=payload.eventId,studentReference=payload.studentReference,status="CONFIRMED")
        store.next_id+=1; store.items[item.id]=item
        location=f"/registrations/{item.id}"; body=item.model_dump()
        store.idempotency[idempotency_key]={"payload":payload.model_dump(),"status":201,"body":body,"location":location}
    return json_or_xml(request, body, 201, {"Location":location,"ETag":etag_for(item),"Cache-Control":"no-store"})

@app.get("/registrations/{registration_id}", tags=["Registrations"])
def get_registration(registration_id: str, request: Request, if_none_match: str | None = Header(None, alias="If-None-Match")):
    item=store.items.get(registration_id)
    if item is None: raise HTTPException(404, "Registration not found.")
    tag=etag_for(item); headers={"ETag":tag,"Cache-Control":"private, max-age=0, must-revalidate"}
    if if_none_match and if_none_match.strip()==tag: return Response(status_code=304,headers=headers)
    return json_or_xml(request,item.model_dump(),200,headers)

def update_registration(registration_id, payload, if_match, authorization):
    require_bearer(authorization)
    item=store.items.get(registration_id)
    if item is None: raise HTTPException(404,"Registration not found.")
    if not if_match: raise HTTPException(428,"If-Match is required for updates.")
    if if_match != etag_for(item): raise HTTPException(412,"ETag does not match current representation.")
    updated=Registration(id=item.id,eventId=item.eventId,studentReference=payload.studentReference,status=item.status)
    store.items[registration_id]=updated
    return updated

@app.put("/registrations/{registration_id}", tags=["Registrations"])
def replace_registration(registration_id: str, request: Request, payload: RegistrationUpdate,
                         if_match: str | None = Header(None, alias="If-Match"), authorization: str | None = Header(None, alias="Authorization")):
    updated=update_registration(registration_id,payload,if_match,authorization)
    return json_or_xml(request,updated.model_dump(),200,{"ETag":etag_for(updated),"Cache-Control":"no-store"})

@app.patch("/registrations/{registration_id}", tags=["Registrations"])
def patch_registration(registration_id: str, request: Request, payload: RegistrationUpdate,
                       if_match: str | None = Header(None, alias="If-Match"), authorization: str | None = Header(None, alias="Authorization")):
    updated=update_registration(registration_id,payload,if_match,authorization)
    return json_or_xml(request,updated.model_dump(),200,{"ETag":etag_for(updated),"Cache-Control":"no-store"})

@app.delete("/registrations/{registration_id}", status_code=204, tags=["Registrations"])
def delete_registration(registration_id: str, authorization: str | None = Header(None, alias="Authorization"),
                        x_http_method_override: str | None = Header(None, alias="X-HTTP-Method-Override")):
    require_bearer(authorization)
    if x_http_method_override and x_http_method_override.upper()!="DELETE": raise HTTPException(400,"X-HTTP-Method-Override must be DELETE for this operation.")
    if registration_id not in store.items: raise HTTPException(404,"Registration not found.")
    del store.items[registration_id]
    return Response(status_code=204,headers={"Cache-Control":"no-store"})

@app.options("/registrations", include_in_schema=True, tags=["Registrations"])
def registration_options(): return Response(status_code=204,headers={"Allow":"GET, POST, OPTIONS"})
