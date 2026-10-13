# campusEventHUB — Assignment 5

Assignment 5 extends the Assignment 4 registration REST API with HTTP methods, headers, conditional requests, rate limiting, CORS, and retry safety.

## Run tests
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -q
```

## Run API
Start the existing CampusHUB Event Service on port 8001, then:
```powershell
$env:CAMPUSHUB_EVENT_SERVICE_URL = "http://127.0.0.1:8001/events/{event_id}"
uvicorn app:app --reload --port 8000
```

Interactive docs: `http://127.0.0.1:8000/docs`.

Important: this is a coursework demonstration using in-memory storage and a demo bearer token. Do not use it as production authentication or persistence. The React frontend has not yet been switched from mock data to this service.
