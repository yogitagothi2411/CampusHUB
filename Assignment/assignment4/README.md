# CampusHUB Web Services — Assignment 4

This repository layout contains a CampusHUB-adapted REST registration service for CS543 Assignment 4 and preserves the proposed SOAP SMS partner integration separately.

## Folders
- `campushub-rest/`: FastAPI REST service, OpenAPI contract, tests, notes and curl instructions.
- `soap-integration/`: supplied SOAP partner design package. The `.example` service URL is illustrative and not live.

## Quick start
```bash
cd campushub-rest
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```
In another terminal, from `campushub-rest/`, run `pytest -q`.

## Before submitting
1. Confirm the instructor accepts the CampusHUB adaptation. The assignment sheet explicitly says CampusEats and names Catalogue, Orders or Delivery.
2. Replace team ID, student names and roll numbers in `campushub-rest/NOTES.md` and the SOAP PDF if required.
3. Run the curl commands in `campushub-rest/CURL-TESTS.md` and save actual output as `campushub-rest/curl-transcript.txt`.
4. Validate `campushub-rest/openapi.yaml` and save screenshot/terminal evidence.
5. Commit the complete project and submit the repository URL plus the required ZIP.

Storage is in memory for this teaching demo and resets when the server restarts. Do not use real personal data or real secrets in sample files.
