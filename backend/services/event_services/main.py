import os
import json
from fastapi import FastAPI, HTTPException, Path, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from .database import init_db, SessionLocal, Base, get_db
from .models import EventModel
from ..auth.router import router as auth_router
from ..auth.dependencies import role_required
from ..auth import models as auth_models, security as auth_security
from ..clubs.models import ClubModel
from ..clubs.router import router as clubs_router, seed_iiitv_clubs
from ..registrations.models import RegistrationModel
from ..registrations.router import router as registrations_router
from ..notifications.router import router as notifications_router, create_notification
from ..announcements.router import router as announcements_router, seed_demo_announcements
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        # 1. Seed demo users if not present
        demo_users = [
            {
                "name": "Admin Administrator",
                "email": "admin@iiitvadodara.ac.in",
                "password": "admin123",
                "role": "admin",
            },
            {
                "name": "Aryan Sharma",
                "email": "student@iiitvadodara.ac.in",
                "password": "student123",
                "role": "student",
            },
            {
                "name": "Coding Club Lead",
                "email": "organizer@iiitvadodara.ac.in",
                "password": "organizer123",
                "role": "organizer",
            },
        ]
        for u in demo_users:
            existing = db.query(auth_models.User).filter(auth_models.User.email == u["email"]).first()
            if not existing:
                db.add(auth_models.User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=auth_security.get_password_hash(u["password"]),
                    role=u["role"],
                    is_active=True,
                ))
        db.commit()

        # Retrieve organizer id for seeding events
        org_user = db.query(auth_models.User).filter(auth_models.User.email == "organizer@iiitvadodara.ac.in").first()
        org_id = org_user.id if org_user else 1

        # 2. Seed events if empty
        if db.query(EventModel).first() is None:
            demo_events = [
                EventModel(
                    name="Kreiva 2026: Annual Cultural Festival",
                    category="Cultural",
                    venue="Campus Grounds & Open Air Amphitheatre",
                    description="Kreiva is the premier annual cultural festival of IIIT Vadodara with band battles, drama, and fine arts.",
                    date_time=datetime(2026, 11, 6, 10, 0, 0),
                    capacity=400,
                    status="Upcoming",
                    owner_id=org_id,
                ),
                EventModel(
                    name="Cerebro 2026: Annual Technical Festival",
                    category="Technical",
                    venue="Academic Block & Central Computing Labs",
                    description="Cerebro is the flagship technical festival of IIIT Vadodara featuring competitive coding and robotics.",
                    date_time=datetime(2026, 10, 24, 9, 0, 0),
                    capacity=300,
                    status="Upcoming",
                    owner_id=org_id,
                ),
                EventModel(
                    name="HackIIITV 2026: 36-Hour Hackathon",
                    category="Technical",
                    venue="Central Computer Labs",
                    description="Flagship 36-hour hackathon with tracks in AI/ML, Web3, and Open Innovation.",
                    date_time=datetime(2026, 10, 18, 10, 0, 0),
                    capacity=200,
                    status="Upcoming",
                    owner_id=org_id,
                ),
                EventModel(
                    name="Alfaaz 2026: Literary & Debating Fest",
                    category="Cultural",
                    venue="Seminar Hall 1",
                    description="Annual parliamentary debate, slam poetry, and creative writing showcase.",
                    date_time=datetime(2026, 10, 28, 14, 0, 0),
                    capacity=150,
                    status="Upcoming",
                    owner_id=org_id,
                ),
                EventModel(
                    name="OLYMPUS 2026: Annual Sports Meet",
                    category="Sports",
                    venue="Sports Complex",
                    description="Inter-batch championship in football, cricket, basketball, badminton, and athletics.",
                    date_time=datetime(2026, 11, 14, 8, 0, 0),
                    capacity=350,
                    status="Upcoming",
                    owner_id=org_id,
                ),
                EventModel(
                    name="Enigma: Cryptic Hunt 2025",
                    category="Technical",
                    venue="Online & Campus",
                    description="Campus-wide riddle solving and cryptographic puzzle challenge.",
                    date_time=datetime(2025, 11, 15, 18, 0, 0),
                    capacity=180,
                    status="Completed",
                    owner_id=org_id,
                ),
            ]
            db.add_all(demo_events)
            db.commit()

        # 3. Seed verified IIIT Vadodara clubs if empty
        if db.query(ClubModel).first() is None:
            clubs_data = [
                ClubModel(
                    id="club-coding",
                    name="Coding Club",
                    short_name="Coding Club",
                    category="Technical",
                    committee="Technical Committee",
                    description="The premier competitive programming and algorithmic problem-solving society of IIIT Vadodara. Organizes regular contest series, ICPC mentorship, and technical challenges.",
                    lead="Arjun Mehta",
                    contact_email="codingclub@iiitvadodara.ac.in",
                    members_count=140,
                    tags_json=json.dumps(["Competitive Programming", "Algorithms", "Data Structures", "ICPC"]),
                    image="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-enigma",
                    name="Enigma",
                    short_name="Enigma",
                    category="Technical",
                    committee="Technical Committee",
                    description="The Web, App, and Open Source development community at IIIT Vadodara. Mentors students in full-stack engineering, cloud technologies, devops, and open source contributions.",
                    lead="Rohan Sharma",
                    contact_email="enigma@iiitvadodara.ac.in",
                    members_count=125,
                    tags_json=json.dumps(["Web Development", "Open Source", "DevOps", "Mobile Apps"]),
                    image="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-dot",
                    name="DOT",
                    short_name="DOT",
                    category="Design",
                    committee="Technical Committee",
                    description="The UI/UX and product design club of IIIT Vadodara. Focuses on interface design, design systems, visual arts, 3D modeling, and creative digital experiences.",
                    lead="Sneha Kulkarni",
                    contact_email="dot@iiitvadodara.ac.in",
                    members_count=85,
                    tags_json=json.dumps(["UI/UX", "Figma", "Product Design", "Visual Arts"]),
                    image="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-finance",
                    name="Finance & Consulting Club",
                    short_name="Finance & Consulting",
                    category="Management",
                    committee="Technical Committee",
                    description="Promotes understanding of financial markets, quantitative analysis, venture capital, case interviews, and management consulting for future tech leaders.",
                    lead="Dhruv Kapoor",
                    contact_email="fcc@iiitvadodara.ac.in",
                    members_count=70,
                    tags_json=json.dumps(["FinTech", "Case Studies", "Consulting", "Venture Capital"]),
                    image="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-mod5",
                    name="MOD5",
                    short_name="MOD5",
                    category="Gaming",
                    committee="Cultural Committee",
                    description="The gaming, eSports, and game development society of IIIT Vadodara. Hosts gaming tournaments and game design workshops.",
                    lead="Aditya Kumar",
                    contact_email="mod5@iiitvadodara.ac.in",
                    members_count=95,
                    tags_json=json.dumps(["eSports", "Game Dev", "Gaming", "Unity"]),
                    image="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-encore",
                    name="Encore",
                    short_name="Encore",
                    category="Cultural",
                    committee="Cultural Committee",
                    description="The official music club of IIIT Vadodara. Unites vocalists, instrumentalists, and composers across classical, acoustic, rock, and fusion genres.",
                    lead="Meera Pillai",
                    contact_email="encore@iiitvadodara.ac.in",
                    members_count=65,
                    tags_json=json.dumps(["Music", "Vocal", "Instruments", "Band Performances"]),
                    image="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-masquerade",
                    name="Masquerade",
                    short_name="Masquerade",
                    category="Cultural",
                    committee="Cultural Committee",
                    description="The dramatics and street theatre society. Produces stage plays, street plays (Nukkad Natak), and dramatic acts reflecting social consciousness and art.",
                    lead="Vikram Rao",
                    contact_email="masquerade@iiitvadodara.ac.in",
                    members_count=50,
                    tags_json=json.dumps(["Theatre", "Dramatics", "Street Play", "Acting"]),
                    image="https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-obscura",
                    name="Obscura",
                    short_name="Obscura",
                    category="Cultural",
                    committee="Cultural Committee",
                    description="The photography and cinematography club of IIIT Vadodara. Captures campus moments, fest coverage, documentary filmmaking, and photo walks.",
                    lead="Tanvi Shah",
                    contact_email="obscura@iiitvadodara.ac.in",
                    members_count=55,
                    tags_json=json.dumps(["Photography", "Filmmaking", "Visual Media", "Video Editing"]),
                    image="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-shades",
                    name="Shades",
                    short_name="Shades",
                    category="Cultural",
                    committee="Cultural Committee",
                    description="The fine arts and sketching society. Brings together painters, sketch artists, digital illustrators, and sculptors to create campus visual exhibits.",
                    lead="Pooja Desai",
                    contact_email="shades@iiitvadodara.ac.in",
                    members_count=45,
                    tags_json=json.dumps(["Fine Arts", "Painting", "Sketching", "Illustration"]),
                    image="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-pensieve",
                    name="Pensieve",
                    short_name="Pensieve",
                    category="Literature",
                    committee="Cultural Committee",
                    description="The literary and debating society of IIIT Vadodara. Hosts parliamentary debates, model UN, poetry slams, elocutions, and book discussion panels.",
                    lead="Harshit Malhotra",
                    contact_email="pensieve@iiitvadodara.ac.in",
                    members_count=60,
                    tags_json=json.dumps(["Debating", "Literature", "Poetry", "Public Speaking"]),
                    image="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="club-editorial",
                    name="Editorial Board",
                    short_name="Editorial",
                    category="Literature",
                    committee="Cultural Committee",
                    description="The official campus journalism and newsletter editorial board. Publishes student articles, interview features with alumni, and the annual institute magazine.",
                    lead="Riya Bhatt",
                    contact_email="editorial@iiitvadodara.ac.in",
                    members_count=40,
                    tags_json=json.dumps(["Journalism", "Newsletter", "Writing", "Campus Media"]),
                    image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="comm-technical",
                    name="Technical Committee",
                    short_name="Tech Committee",
                    category="Technical",
                    committee="Technical Committee",
                    description="The apex student technical council responsible for organizing Cerebro, institute-wide hackathons, technical symposiums, and overseeing all technical clubs.",
                    lead="Ananya Sen",
                    contact_email="techcomm@iiitvadodara.ac.in",
                    members_count=30,
                    tags_json=json.dumps(["Cerebro", "Technical Council", "Symposiums", "Leadership"]),
                    image="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="comm-cultural",
                    name="Cultural Committee",
                    short_name="Cultural Committee",
                    category="Cultural",
                    committee="Cultural Committee",
                    description="The apex student cultural council responsible for organizing Kreiva, Alfaaz, festive celebrations, and coordinating all cultural performing arts societies.",
                    lead="Aarav Patel",
                    contact_email="cultcomm@iiitvadodara.ac.in",
                    members_count=35,
                    tags_json=json.dumps(["Kreiva", "Cultural Council", "Festivals", "Performing Arts"]),
                    image="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
                ClubModel(
                    id="comm-sports",
                    name="Sports Committee",
                    short_name="Sports Committee",
                    category="Sports",
                    committee="Sports Committee",
                    description="The student sports council responsible for organizing OLYMPUS, inter-batch leagues, fitness initiatives, and training varsity teams for inter-IIIT tournaments.",
                    lead="Karthik Nair",
                    contact_email="sportscomm@iiitvadodara.ac.in",
                    members_count=40,
                    tags_json=json.dumps(["OLYMPUS", "Inter-IIIT", "Athletics", "Tournaments"]),
                    image="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80",
                    cover_image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80",
                    status="Active",
                ),
            ]
            db.add_all(clubs_data)
            db.commit()

        # 4. Seed demo announcements if empty
        admin_user = db.query(auth_models.User).filter(auth_models.User.role == "admin").first()
        if admin_user:
            seed_demo_announcements(db, admin_id=admin_user.id)
    finally:
        db.close()
    yield

app = FastAPI(
    title="campusEventHUB Event Service",
    description="REST API for college events at IIIT Vadodara",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    origin.strip() for origin in cors_origins_env.split(",") if origin.strip()
]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(clubs_router)
app.include_router(registrations_router)
app.include_router(notifications_router)
app.include_router(announcements_router)

# ---------------------------------------------------------------------------
# Pydantic schemas (response models)
# ---------------------------------------------------------------------------
class EventBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Technical Hackathon"})
    category: str = Field(..., json_schema_extra={"example": "Technical"})
    venue: str = Field(..., json_schema_extra={"example": "IIIT Vadodara"})
    description: Optional[str] = Field(None, json_schema_extra={"example": "A 24‑hour coding marathon"})
    date_time: Optional[datetime] = Field(None, json_schema_extra={"example": "2024-04-20T10:00:00"})
    capacity: Optional[int] = Field(None, ge=1, json_schema_extra={"example": 200})
    status: Optional[str] = Field(None, description="Current status e.g. Upcoming, Ongoing, Completed")

    model_config = ConfigDict(from_attributes=True)

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    date_time: Optional[datetime] = None
    capacity: Optional[int] = Field(None, ge=1)
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class Event(EventBase):
    id: int = Field(..., json_schema_extra={"example": 1})
    owner_id: Optional[int] = None
    registered_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------------------------
# Basic health endpoints
# ---------------------------------------------------------------------------
@app.get("/", summary="Root endpoint", description="Simple sanity check that the service is running")
def home():
    return {"message": "campusEventHUB Event Service is running!!!!!!!!"}

@app.get("/health", summary="Health check", description="Returns service health status")
def health_check():
    return {"status": "healthy"}

# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------
@app.get("/events", summary="List events", response_model=List[Event])
def list_events(db: Session = Depends(get_db)):
    events = db.query(EventModel).all()
    # Compute live registered_count for each event
    res = []
    for ev in events:
        active_count = db.query(func.count(RegistrationModel.id)).filter(
            RegistrationModel.event_id == ev.id,
            RegistrationModel.status == "registered",
        ).scalar() or 0
        ev_dict = {c.name: getattr(ev, c.name) for c in ev.__table__.columns}
        ev_dict["registered_count"] = active_count
        res.append(Event(**ev_dict))
    return res

@app.get(
    "/events/{event_id}",
    summary="Get single event",
    response_model=Event,
    responses={404: {"description": "Event not found"}},
)
def get_event(event_id: int = Path(..., ge=1), db: Session = Depends(get_db)):
    ev = db.query(EventModel).filter(EventModel.id == event_id).first()
    if ev is None:
        raise HTTPException(status_code=404, detail="Event not found")
    active_count = db.query(func.count(RegistrationModel.id)).filter(
        RegistrationModel.event_id == ev.id,
        RegistrationModel.status == "registered",
    ).scalar() or 0
    ev_dict = {c.name: getattr(ev, c.name) for c in ev.__table__.columns}
    ev_dict["registered_count"] = active_count
    return Event(**ev_dict)

@app.post(
    "/events",
    summary="Create a new event",
    response_model=Event,
    status_code=201,
    responses={400: {"description": "Duplicate ID or validation error"}},
)
def create_event(
    event: EventCreate = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(role_required("organizer", "admin")),
):
    db_event = EventModel(**event.model_dump(), owner_id=current_user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.put(
    "/events/{event_id}",
    summary="Replace an existing event",
    response_model=Event,
    responses={404: {"description": "Event not found"}},
)
def replace_event(
    event_id: int = Path(..., ge=1),
    event: EventCreate = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(role_required("organizer", "admin")),
):
    db_event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "admin" and db_event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own events")

    old_venue = db_event.venue
    old_datetime = db_event.date_time
    old_status = db_event.status

    for field, value in event.model_dump().items():
        setattr(db_event, field, value)
    db.commit()
    db.refresh(db_event)

    # Notify attendees if status cancelled or critical details changed
    try:
        active_regs = db.query(RegistrationModel).filter(
            RegistrationModel.event_id == db_event.id,
            RegistrationModel.status == "registered",
        ).all()
        for reg in active_regs:
            if db_event.status == "Cancelled" and old_status != "Cancelled":
                create_notification(
                    db=db,
                    recipient_user_id=reg.student_id,
                    title=f"Event Cancelled: {db_event.name}",
                    message=f"Notice: '{db_event.name}' has been cancelled by the organizer.",
                    notification_type="cancellation",
                    event_id=db_event.id,
                )
            elif old_venue != db_event.venue or old_datetime != db_event.date_time:
                create_notification(
                    db=db,
                    recipient_user_id=reg.student_id,
                    title=f"Event Update: {db_event.name}",
                    message=f"Notice: The schedule or venue for '{db_event.name}' has been updated to {db_event.venue}.",
                    notification_type="event_update",
                    event_id=db_event.id,
                )
    except Exception:
        pass

    return db_event

@app.patch(
    "/events/{event_id}",
    summary="Partially update an event",
    response_model=Event,
    responses={404: {"description": "Event not found"}},
)
def update_event(
    event_id: int = Path(..., ge=1),
    changes: EventUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(role_required("organizer", "admin")),
):
    db_event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "admin" and db_event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own events")

    old_venue = db_event.venue
    old_datetime = db_event.date_time
    old_status = db_event.status

    update_data = changes.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    db.commit()
    db.refresh(db_event)

    # Notify attendees if status cancelled or critical details changed
    try:
        active_regs = db.query(RegistrationModel).filter(
            RegistrationModel.event_id == db_event.id,
            RegistrationModel.status == "registered",
        ).all()
        for reg in active_regs:
            if db_event.status == "Cancelled" and old_status != "Cancelled":
                create_notification(
                    db=db,
                    recipient_user_id=reg.student_id,
                    title=f"Event Cancelled: {db_event.name}",
                    message=f"Notice: '{db_event.name}' has been cancelled by the organizer.",
                    notification_type="cancellation",
                    event_id=db_event.id,
                )
            elif (old_venue != db_event.venue or old_datetime != db_event.date_time) and ("venue" in update_data or "date_time" in update_data):
                create_notification(
                    db=db,
                    recipient_user_id=reg.student_id,
                    title=f"Event Update: {db_event.name}",
                    message=f"Notice: The schedule or venue for '{db_event.name}' has been updated to {db_event.venue}.",
                    notification_type="event_update",
                    event_id=db_event.id,
                )
    except Exception:
        pass

    return db_event

@app.delete(
    "/events/{event_id}",
    summary="Delete an event",
    status_code=204,
    responses={404: {"description": "Event not found"}},
)
def delete_event(
    event_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user=Depends(role_required("organizer", "admin")),
):
    db_event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "admin" and db_event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own events")

    # Notify attendees before deleting event
    try:
        active_regs = db.query(RegistrationModel).filter(
            RegistrationModel.event_id == db_event.id,
            RegistrationModel.status == "registered",
        ).all()
        for reg in active_regs:
            create_notification(
                db=db,
                recipient_user_id=reg.student_id,
                title=f"Event Cancelled: {db_event.name}",
                message=f"Notice: '{db_event.name}' has been cancelled and removed from the schedule.",
                notification_type="cancellation",
                event_id=None,
            )
    except Exception:
        pass

    db.delete(db_event)
    db.commit()
    return