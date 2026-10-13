# CampusHUB Registration Service — Assignment 6

This continues the Assignment 5 service and adds consistent Problem Details errors, aggregated field validation, JSON/XML response negotiation, `Retry-After` for `429`/`503`, safer internal-error mapping, and updated OpenAPI documentation.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

OpenAPI UI: http://127.0.0.1:8000/docs

The successful registration path calls the existing CampusHUB Event Service at `CAMPUSHUB_EVENT_SERVICE_URL` (default `http://127.0.0.1:8001/events/{event_id}`). That dependency must return a successful response for the requested event. The default demo bearer token is `campushub-demo-token`.

## Verify

```bash
pytest -q
```

See `NOTES.md` for answers and `transcript.txt` for curl scenarios. All IDs and registration data live in an in-memory demo store and reset when the server restarts.
