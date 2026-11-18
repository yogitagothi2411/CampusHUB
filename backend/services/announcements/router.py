from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..event_services.database import get_db
from ..auth.dependencies import role_required, get_current_user_optional, get_current_user
from ..auth.models import User
from . import models, schemas
from ..notifications.router import create_notification

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("", response_model=List[schemas.AnnouncementRead], summary="List published campus announcements")
def list_announcements(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search announcement title and body"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    query = db.query(models.AnnouncementModel)

    # Non-admins only see published announcements
    if not (current_user and current_user.role == "admin"):
        query = query.filter(models.AnnouncementModel.is_published == True)

    if category and category.lower() != "all":
        query = query.filter(func.lower(models.AnnouncementModel.category) == category.lower())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(models.AnnouncementModel.title).like(term)
            | func.lower(models.AnnouncementModel.body).like(term)
        )

    return query.order_by(models.AnnouncementModel.created_at.desc()).all()

@router.get("/{announcement_id}", response_model=schemas.AnnouncementRead, summary="Get single announcement")
def get_announcement(
    announcement_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    announcement = db.query(models.AnnouncementModel).filter(
        models.AnnouncementModel.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with ID {announcement_id} not found",
        )

    # Check published status for non-admin
    if not announcement.is_published and not (current_user and current_user.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not available",
        )

    return announcement

@router.post("", response_model=schemas.AnnouncementRead, status_code=status.HTTP_201_CREATED, summary="Create an announcement (Admin only)")
def create_announcement(
    ann_in: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin")),
):
    announcement = models.AnnouncementModel(
        title=ann_in.title.strip()[:255],
        body=ann_in.body.strip(),
        category=(ann_in.category or "General").strip(),
        published_by_user_id=current_user.id,
        is_published=ann_in.is_published if ann_in.is_published is not None else True,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    # If published, generate in-app notifications for active users
    if announcement.is_published:
        all_users = db.query(User).filter(User.is_active == True).all()
        for u in all_users:
            if u.id != current_user.id:  # Skip admin author
                create_notification(
                    db=db,
                    recipient_user_id=u.id,
                    title=f"Campus Announcement: {announcement.title}",
                    message=announcement.body[:200] + ("..." if len(announcement.body) > 200 else ""),
                    notification_type="announcement",
                )

    return announcement

@router.put("/{announcement_id}", response_model=schemas.AnnouncementRead, summary="Update an announcement (Admin only)")
def update_announcement(
    ann_in: schemas.AnnouncementUpdate,
    announcement_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin")),
):
    announcement = db.query(models.AnnouncementModel).filter(
        models.AnnouncementModel.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with ID {announcement_id} not found",
        )

    update_data = ann_in.model_dump(exclude_unset=True)
    for field in ["title", "body", "category", "is_published"]:
        if field in update_data and update_data[field] is not None:
            setattr(announcement, field, update_data[field])

    db.commit()
    db.refresh(announcement)
    return announcement

@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an announcement (Admin only)")
def delete_announcement(
    announcement_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin")),
):
    announcement = db.query(models.AnnouncementModel).filter(
        models.AnnouncementModel.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with ID {announcement_id} not found",
        )

    db.delete(announcement)
    db.commit()
    return

def seed_demo_announcements(db: Session, admin_id: int):
    """Seed sample college announcements idempotently."""
    if db.query(models.AnnouncementModel).first() is not None:
        return

    sample_items = [
        {
            "title": "Welcome to IIIT Vadodara Campus Event HUB 2026",
            "body": "Welcome to the centralized event management and student participation hub. Check out the latest technical club hackathons and cultural festivals under the Events tab.",
            "category": "Institute",
            "is_published": True,
        },
        {
            "title": "Annual Flagship Cultural Fest 'Kreiva' Dates Announced",
            "body": "The Cultural Committee has unveiled the official calendar for Kreiva 2026. Student club auditions and stage play entries are now open through their respective societies.",
            "category": "Cultural",
            "is_published": True,
        },
        {
            "title": "Institute Coding League - Round 1 Registration Guidelines",
            "body": "The Programming Club invites students across all batches for the upcoming algorithmic challenge sprint. Check event capacity limits and register early.",
            "category": "Technical",
            "is_published": True,
        },
    ]

    for item in sample_items:
        ann = models.AnnouncementModel(
            title=item["title"],
            body=item["body"],
            category=item["category"],
            published_by_user_id=admin_id,
            is_published=item["is_published"],
        )
        db.add(ann)
    db.commit()
