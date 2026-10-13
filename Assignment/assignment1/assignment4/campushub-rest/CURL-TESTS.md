# Curl test commands for `curl-transcript.txt`

Start the service first with `uvicorn app:app --reload`. Run these commands from a terminal. Save the **actual** verbose output to `curl-transcript.txt`; outputs vary because IDs and ETags depend on run order.

```bash
# 1. Successful create: expect HTTP 201 and Location.
curl -i -v -X POST http://127.0.0.1:8000/registrations -H "Content-Type: application/json" -H "Idempotency-Key: assignment4-demo-001" -d '{"eventId":"evt-hackiiitv-2026","studentReference":"STU-DEMO-001"}'

# 2. Repeat the same request/key: expect HTTP 200 and the same registration body.
curl -i -v -X POST http://127.0.0.1:8000/registrations -H "Content-Type: application/json" -H "Idempotency-Key: assignment4-demo-001" -d '{"eventId":"evt-hackiiitv-2026","studentReference":"STU-DEMO-001"}'

# 3. Malformed JSON: expect HTTP 400.
curl -i -v -X POST http://127.0.0.1:8000/registrations -H "Content-Type: application/json" -d '{bad-json'

# 4. Missing resource: expect HTTP 404.
curl -i -v http://127.0.0.1:8000/registrations/999999

# 5. Missing bearer token: expect HTTP 401.
curl -i -v http://127.0.0.1:8000/protected/demo

# 6. Get a resource and copy its ETag from response headers. Replace <ETAG> below.
curl -i -v http://127.0.0.1:8000/registrations/1
curl -i -v http://127.0.0.1:8000/registrations/1 -H 'If-None-Match: <ETAG>'

# 7. Stale conditional write: expect HTTP 412.
curl -i -v -X POST http://127.0.0.1:8000/registrations/1/cancellation -H 'If-Match: "stale-tag"'

# 8. State conflict: after cancelling registration 1, repeat cancellation; expect HTTP 409.
curl -i -v -X POST http://127.0.0.1:8000/registrations/1/cancellation
curl -i -v -X POST http://127.0.0.1:8000/registrations/1/cancellation
```

On PowerShell, if quoting JSON is difficult, use `curl.exe` explicitly and use double quotes carefully. Capture both successful and failure paths. Do not submit this command list as if it were the transcript; paste the actual terminal output into `curl-transcript.txt`.
