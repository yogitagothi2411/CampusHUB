import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..event_services.database import get_db
from ..auth.dependencies import role_required
from . import models, schemas

router = APIRouter(prefix="/clubs", tags=["Clubs"])

def generate_club_slug(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", name).strip().lower()
    slug = re.sub(r"\s+", "-", cleaned)
    return f"club-{slug}" if not slug.startswith("club-") and not slug.startswith("comm-") else slug

@router.get("", response_model=List[schemas.ClubRead], summary="List all clubs")
def list_clubs(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name, lead, or description"),
    status: Optional[str] = Query(None, description="Filter by status (Active/Inactive)"),
    db: Session = Depends(get_db),
):
    query = db.query(models.ClubModel)

    if category and category.lower() != "all":
        query = query.filter(func.lower(models.ClubModel.category) == category.lower())

    if status and status.lower() != "all":
        query = query.filter(func.lower(models.ClubModel.status) == status.lower())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(models.ClubModel.name).like(term)
            | func.lower(models.ClubModel.short_name).like(term)
            | func.lower(models.ClubModel.lead).like(term)
            | func.lower(models.ClubModel.description).like(term)
        )

    return query.all()

@router.get("/{club_id}", response_model=schemas.ClubRead, summary="Get single club details")
def get_club(club_id: str, db: Session = Depends(get_db)):
    club = db.query(models.ClubModel).filter(models.ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID '{club_id}' not found",
        )
    return club

@router.post("", response_model=schemas.ClubRead, status_code=status.HTTP_201_CREATED, summary="Create a new club (Admin only)")
def create_club(
    club_in: schemas.ClubCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required("admin")),
):
    club_id = club_in.id.strip() if club_in.id and club_in.id.strip() else generate_club_slug(club_in.name)

    # Check ID uniqueness
    if db.query(models.ClubModel).filter(models.ClubModel.id == club_id).first():
        # If auto-generated collision, append timestamp
        import time
        club_id = f"{club_id}-{int(time.time())}"

    # Check Name uniqueness
    existing_name = db.query(models.ClubModel).filter(func.lower(models.ClubModel.name) == club_in.name.strip().lower()).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Club with name '{club_in.name}' already exists",
        )

    new_club = models.ClubModel(
        id=club_id,
        name=club_in.name.strip(),
        short_name=club_in.short_name.strip() if club_in.short_name else club_in.name.strip(),
        category=club_in.category,
        committee=club_in.committee,
        description=club_in.description,
        lead=club_in.lead,
        faculty_coordinator=club_in.faculty_coordinator,
        contact_email=club_in.contact_email,
        members_count=club_in.members_count or 1,
        image=club_in.image,
        cover_image=club_in.cover_image,
        status=club_in.status or "Active",
    )
    new_club.tags = club_in.tags or []

    db.add(new_club)
    db.commit()
    db.refresh(new_club)
    return new_club

@router.put("/{club_id}", response_model=schemas.ClubRead, summary="Update an existing club (Admin only)")
def update_club(
    club_id: str,
    club_in: schemas.ClubUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required("admin")),
):
    club = db.query(models.ClubModel).filter(models.ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID '{club_id}' not found",
        )

    update_data = club_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"]:
        # Check name uniqueness among other clubs
        name_check = db.query(models.ClubModel).filter(
            func.lower(models.ClubModel.name) == update_data["name"].strip().lower(),
            models.ClubModel.id != club_id
        ).first()
        if name_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Club with name '{update_data['name']}' already exists",
            )
        club.name = update_data["name"].strip()

    for field in [
        "short_name", "category", "committee", "description",
        "lead", "faculty_coordinator", "contact_email", "members_count",
        "image", "cover_image", "status"
    ]:
        if field in update_data and update_data[field] is not None:
            setattr(club, field, update_data[field])

    if "tags" in update_data and update_data["tags"] is not None:
        club.tags = update_data["tags"]

    db.commit()
    db.refresh(club)
    return club

@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a club (Admin only)")
def delete_club(
    club_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(role_required("admin")),
):
    club = db.query(models.ClubModel).filter(models.ClubModel.id == club_id).first()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with ID '{club_id}' not found",
        )

    db.delete(club)
    db.commit()
    return


def seed_iiitv_clubs(db: Session):
    import json
    verified_clubs = [
        {
            "id": "club-coding",
            "name": "Coding Club",
            "short_name": "Coding Club",
            "category": "Technical",
            "committee": "Technical Committee",
            "description": "The premier competitive programming and algorithmic problem-solving society of IIIT Vadodara. Organizes regular contest series, ICPC mentorship, and technical challenges.",
            "lead": "Arjun Mehta",
            "contact_email": "codingclub@iiitvadodara.ac.in",
            "members_count": 140,
            "tags": ["Competitive Programming", "Algorithms", "Data Structures", "ICPC"],
            "image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-enigma",
            "name": "Enigma",
            "short_name": "Enigma",
            "category": "Technical",
            "committee": "Technical Committee",
            "description": "The Web, App, and Open Source development community at IIIT Vadodara. Mentors students in full-stack engineering, cloud technologies, devops, and open source contributions.",
            "lead": "Rohan Sharma",
            "contact_email": "enigma@iiitvadodara.ac.in",
            "members_count": 125,
            "tags": ["Web Development", "Open Source", "DevOps", "Mobile Apps"],
            "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-dot",
            "name": "DOT",
            "short_name": "DOT",
            "category": "Design",
            "committee": "Technical Committee",
            "description": "The UI/UX and product design club of IIIT Vadodara. Focuses on interface design, design systems, visual arts, 3D modeling, and creative digital experiences.",
            "lead": "Sneha Kulkarni",
            "contact_email": "dot@iiitvadodara.ac.in",
            "members_count": 85,
            "tags": ["UI/UX", "Figma", "Product Design", "Visual Arts"],
            "image": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-finance",
            "name": "Finance & Consulting Club",
            "short_name": "Finance & Consulting",
            "category": "Management",
            "committee": "Technical Committee",
            "description": "Promotes understanding of financial markets, quantitative analysis, venture capital, case interviews, and management consulting for future tech leaders.",
            "lead": "Dhruv Kapoor",
            "contact_email": "fcc@iiitvadodara.ac.in",
            "members_count": 70,
            "tags": ["FinTech", "Case Studies", "Consulting", "Venture Capital"],
            "image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-mod5",
            "name": "MOD5",
            "short_name": "MOD5",
            "category": "Gaming",
            "committee": "Cultural Committee",
            "description": "The gaming, eSports, and game development society of IIIT Vadodara. Hosts gaming tournaments and game design workshops.",
            "lead": "Aditya Kumar",
            "contact_email": "mod5@iiitvadodara.ac.in",
            "members_count": 95,
            "tags": ["eSports", "Game Dev", "Gaming", "Unity"],
            "image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-encore",
            "name": "Encore",
            "short_name": "Encore",
            "category": "Cultural",
            "committee": "Cultural Committee",
            "description": "The official music club of IIIT Vadodara. Unites vocalists, instrumentalists, and composers across classical, acoustic, rock, and fusion genres.",
            "lead": "Meera Pillai",
            "contact_email": "encore@iiitvadodara.ac.in",
            "members_count": 65,
            "tags": ["Music", "Vocal", "Instruments", "Band Performances"],
            "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-masquerade",
            "name": "Masquerade",
            "short_name": "Masquerade",
            "category": "Cultural",
            "committee": "Cultural Committee",
            "description": "The dramatics and street theatre society. Produces stage plays, street plays (Nukkad Natak), and dramatic acts reflecting social consciousness and art.",
            "lead": "Vikram Rao",
            "contact_email": "masquerade@iiitvadodara.ac.in",
            "members_count": 50,
            "tags": ["Theatre", "Dramatics", "Street Play", "Acting"],
            "image": "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-obscura",
            "name": "Obscura",
            "short_name": "Obscura",
            "category": "Cultural",
            "committee": "Cultural Committee",
            "description": "The photography and cinematography club of IIIT Vadodara. Captures campus moments, fest coverage, documentary filmmaking, and photo walks.",
            "lead": "Tanvi Shah",
            "contact_email": "obscura@iiitvadodara.ac.in",
            "members_count": 55,
            "tags": ["Photography", "Filmmaking", "Visual Media", "Video Editing"],
            "image": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-shades",
            "name": "Shades",
            "short_name": "Shades",
            "category": "Cultural",
            "committee": "Cultural Committee",
            "description": "The fine arts and sketching society. Brings together painters, sketch artists, digital illustrators, and sculptors to create campus visual exhibits.",
            "lead": "Pooja Desai",
            "contact_email": "shades@iiitvadodara.ac.in",
            "members_count": 45,
            "tags": ["Fine Arts", "Painting", "Sketching", "Illustration"],
            "image": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-pensieve",
            "name": "Pensieve",
            "short_name": "Pensieve",
            "category": "Literature",
            "committee": "Cultural Committee",
            "description": "The literary and debating society of IIIT Vadodara. Hosts parliamentary debates, model UN, poetry slams, elocutions, and book discussion panels.",
            "lead": "Harshit Malhotra",
            "contact_email": "pensieve@iiitvadodara.ac.in",
            "members_count": 60,
            "tags": ["Debating", "Literature", "Poetry", "Public Speaking"],
            "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "club-editorial",
            "name": "Editorial Board",
            "short_name": "Editorial",
            "category": "Literature",
            "committee": "Cultural Committee",
            "description": "The official campus journalism and newsletter editorial board. Publishes student articles, interview features with alumni, and the annual institute magazine.",
            "lead": "Riya Bhatt",
            "contact_email": "editorial@iiitvadodara.ac.in",
            "members_count": 40,
            "tags": ["Journalism", "Newsletter", "Writing", "Campus Media"],
            "image": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "comm-technical",
            "name": "Technical Committee",
            "short_name": "Tech Committee",
            "category": "Technical",
            "committee": "Technical Committee",
            "description": "The apex student technical council responsible for organizing Cerebro, institute-wide hackathons, technical symposiums, and overseeing all technical clubs.",
            "lead": "Ananya Sen",
            "contact_email": "techcomm@iiitvadodara.ac.in",
            "members_count": 30,
            "tags": ["Cerebro", "Technical Council", "Symposiums", "Leadership"],
            "image": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "comm-cultural",
            "name": "Cultural Committee",
            "short_name": "Cultural Committee",
            "category": "Cultural",
            "committee": "Cultural Committee",
            "description": "The apex student cultural council responsible for organizing Kreiva, Alfaaz, festive celebrations, and coordinating all cultural performing arts societies.",
            "lead": "Aarav Patel",
            "contact_email": "cultcomm@iiitvadodara.ac.in",
            "members_count": 35,
            "tags": ["Kreiva", "Cultural Council", "Festivals", "Performing Arts"],
            "image": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
        {
            "id": "comm-sports",
            "name": "Sports Committee",
            "short_name": "Sports Committee",
            "category": "Sports",
            "committee": "Sports Committee",
            "description": "The student sports council responsible for organizing OLYMPUS, inter-batch leagues, fitness initiatives, and training varsity teams for inter-IIIT tournaments.",
            "lead": "Karthik Nair",
            "contact_email": "sportscomm@iiitvadodara.ac.in",
            "members_count": 40,
            "tags": ["OLYMPUS", "Inter-IIIT", "Athletics", "Tournaments"],
            "image": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80",
            "cover_image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80",
            "status": "Active",
        },
    ]

    for item in verified_clubs:
        existing = db.query(models.ClubModel).filter(models.ClubModel.id == item["id"]).first()
        if not existing:
            c = models.ClubModel(
                id=item["id"],
                name=item["name"],
                short_name=item["short_name"],
                category=item["category"],
                committee=item["committee"],
                description=item["description"],
                lead=item["lead"],
                contact_email=item["contact_email"],
                members_count=item["members_count"],
                tags_json=json.dumps(item["tags"]),
                image=item["image"],
                cover_image=item["cover_image"],
                status=item["status"],
            )
            db.add(c)
    db.commit()

