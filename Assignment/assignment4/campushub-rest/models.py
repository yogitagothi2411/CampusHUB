from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class Registration:
    registration_id: str
    event_id: str
    student_reference: str
    status: str = "CONFIRMED"
    idempotency_key: Optional[str] = None

    def as_json(self) -> dict:
        """Public representation: intentionally omits internal idempotency key."""
        return {
            "id": self.registration_id,
            "eventId": self.event_id,
            "studentReference": self.student_reference,
            "status": self.status,
        }


def validate_registration(body):
    """Validate the incoming JSON before accessing individual fields."""
    if not isinstance(body, dict):
        return "Request body must be a JSON object."
    required = ("eventId", "studentReference")
    for field in required:
        if field not in body:
            return f"Missing required field: {field}."
        if not isinstance(body[field], str) or not body[field].strip():
            return f"Field '{field}' must be a non-empty string."
    if len(body["eventId"]) > 100 or len(body["studentReference"]) > 100:
        return "eventId and studentReference must be at most 100 characters."
    return None
