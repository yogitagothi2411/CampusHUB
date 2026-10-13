# Assignment 5: local run and curl verification (Windows PowerShell)

## 1. Install and run

Terminal 1: from the CampusHUB project root, start the existing Event Service:
```powershell
cd backend
pip install -r requirements.txt
uvicorn services.event_services.main:app --reload --port 8001
```

Terminal 2: start the Assignment 5 registration service:
```powershell
cd path	o\CampusHUB_Assignment5\campushub-rest
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:CAMPUSHUB_EVENT_SERVICE_URL = "http://127.0.0.1:8001/events/{event_id}"
$env:API_BEARER_TOKEN = "campushub-demo-token"
uvicorn app:app --reload --port 8000
```

## 2. Run curl -v scenarios

Run from a third terminal. The first create should return 201 and `Location`. Repeating exactly the same key and body should return the same registration and `Idempotency-Replayed: true`.
```powershell
curl.exe -v -X POST http://127.0.0.1:8000/registrations -H "Content-Type: application/json" -H "Accept: application/json" -H "Idempotency-Key: a5-demo-001" -d "{"eventId":"1","studentReference":"STU-DEMO-001"}"
curl.exe -v -X POST http://127.0.0.1:8000/registrations -H "Content-Type: application/json" -H "Accept: application/json" -H "Idempotency-Key: a5-demo-001" -d "{"eventId":"1","studentReference":"STU-DEMO-001"}"
curl.exe -v http://127.0.0.1:8000/registrations/1
curl.exe -v http://127.0.0.1:8000/registrations/1 -H "If-None-Match: "PASTE_ETAG_FROM_PREVIOUS_RESPONSE""
curl.exe -v -X PUT http://127.0.0.1:8000/registrations/1 -H "Authorization: Bearer campushub-demo-token" -H "If-Match: "stale-tag"" -H "Content-Type: application/json" -d "{"studentReference":"STU-UPDATED"}"
curl.exe -v -X POST http://127.0.0.1:8000/registrations -H "Content-Type: application/json" -d "{bad-json"
curl.exe -v http://127.0.0.1:8000/registrations/999999
curl.exe -v -X PUT http://127.0.0.1:8000/registrations/1 -H "If-Match: "any-tag"" -H "Content-Type: application/json" -d "{"studentReference":"STU-X"}"
```

The assignment specifically requires actual `curl -v` evidence. Run the commands locally and paste their real output into `curl-transcript.txt`; do not submit invented terminal output. For a valid malformed-JSON 400, ensure FastAPI's request validation response is 422 by default; the service includes explicit 400 for missing Idempotency-Key. The 400 example above is malformed JSON and may be 422 depending on framework validation, so use the missing-key request below to reliably demonstrate 400:
```powershell
curl.exe -v -X POST http://127.0.0.1:8000/registrations -H "Content-Type: application/json" -d "{"eventId":"1","studentReference":"STU-1"}"
```
