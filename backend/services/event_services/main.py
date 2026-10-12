
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="campusEventHUB Event Service",
    description="REST API for college events at IIIT Vadodara",
    version="1.0.0",
)


@app.get("/")
def home():
    return {"message": "campusEventHUB Event Service is running!!!!!!!!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

class EventCreate(BaseModel):
    name: str
    category: str
    venue: str

# Temporary event data — database baad mein add karenge
events = [
    {
        "id": 1,
        "name": "Technical Hackathon",
        "category": "Technical",
        "venue": "IIIT Vadodara",
    },
    {
        "id": 2,
        "name": "Cultural Fest",
        "category": "Cultural",
        "venue": "IIIT Vadodara",
    },
]


@app.get("/events")
def get_events():
    return {"events": events}




@app.get("/events/{event_id}")
def get_event(event_id: int):
    for event in events:
        if event["id"] == event_id:
            return {"event": event}

    raise HTTPException(
        status_code=404,
        detail="Event not found",
    )


@app.post("/events", status_code=201)
def create_event(new_event: EventCreate):
    event = {
        "id": max((item["id"] for item in events), default=0) + 1,
        "name": new_event.name,
        "category": new_event.category,
        "venue": new_event.venue,
    }

    events.append(event)

    return {
        "message": "Event created successfully",
        "event": event,
    }