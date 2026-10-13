# CampusHUB — Assignment 6

**Subject:** REST API / CampusHUB Registration Service  
**Assignment:** Honest Responses: Status Codes, Errors & Validation

## Team details — complete before submission

| Roll Number | Name |
|---|---|
| 20251651107 | Yogita (Team Leader) |
| 20251651047 | Janvi |
| 20251651086 | Shreya Verma |
| 20251651088 | Sonali |

## Project contents

- `campushub-rest/app.py` — updated existing Registration Service (not a new service)
- `campushub-rest/openapi.yaml` — OpenAPI contract with status codes and Problem Details schema
- `campushub-rest/transcript.txt` — curl examples for success, failure, negotiation and A5 regressions
- `campushub-rest/NOTES.md` — answers to the assignment questions
- `campushub-rest/tests/test_api.py` — automated regression tests

## Run

```bash
cd campushub-rest
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

The registration creation endpoint checks `eventId` through the CampusHUB Event Service. Set `CAMPUSHUB_EVENT_SERVICE_URL` if your Assignment 5 Event Service runs at a different address. Default demo bearer token is `campushub-demo-token`; override with `API_BEARER_TOKEN`.

Run tests from `campushub-rest`:

```bash
pytest -q
```

**Important:** This is intentionally the CampusHUB *Registration* API from Assignment 5. It does not invent an `/orders` service. Read `campushub-rest/NOTES.md` for the endpoint/status map and the explanation of how the assignment's sample Orders error types map to this project.
