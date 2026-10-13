from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from ..event_services.database import get_db
from ..auth.dependencies import get_current_user
from ..auth.models import User
from . import models, schemas
from ..event_services.models import EventModel
from ..registrations.models import RegistrationModel

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def create_notification(
    db: Session,
    recipient_user_id: int,
    title: str,
    message: str,
    notification_type: str = "general",
    event_id: Optional[int] = None,
) -> models.NotificationModel:
    """Internal helper to dispatch in-app notifications safely."""
    notif = models.NotificationModel(
        recipient_user_id=recipient_user_id,
        title=title.strip()[:255],
        message=message.strip(),
        notification_type=notification_type,
        event_id=event_id,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.get("/me", response_model=List[schemas.NotificationRead], summary="Get current user's notifications")
def get_my_notifications(
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(models.NotificationModel).filter(
        models.NotificationModel.recipient_user_id == current_user.id
    )
    if unread_only:
        query = query.filter(models.NotificationModel.is_read == False)

    return query.order_by(models.NotificationModel.created_at.desc()).limit(limit).all()

@router.get("/me/unread-count", response_model=schemas.UnreadCountResponse, summary="Get unread notification count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(models.NotificationModel).filter(
        models.NotificationModel.recipient_user_id == current_user.id,
        models.NotificationModel.is_read == False,
    ).count()
    return {"unread_count": count}

@router.patch("/{notification_id}/read", response_model=schemas.NotificationRead, summary="Mark a notification as read")
def mark_notification_read(
    notification_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(models.NotificationModel).filter(
        models.NotificationModel.id == notification_id,
        models.NotificationModel.recipient_user_id == current_user.id,
    ).first()

    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied",
        )

    if not notif.is_read:
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notif)

    return notif

@router.post("/me/read-all", response_model=schemas.MarkAllReadResponse, summary="Mark all current user notifications as read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = db.query(models.NotificationModel).filter(
        models.NotificationModel.recipient_user_id == current_user.id,
        models.NotificationModel.is_read == False,
    ).update(
        {"is_read": True, "read_at": datetime.now(timezone.utc)},
        synchronize_session=False,
    )
    db.commit()
    return {"message": "All notifications marked as read", "updated_count": updated}

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a notification")
def delete_notification(
    notification_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(models.NotificationModel).filter(
        models.NotificationModel.id == notification_id,
        models.NotificationModel.recipient_user_id == current_user.id,
    ).first()

    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied",
        )

    db.delete(notif)
    db.commit()
    return

@router.post("/trigger-reminders", summary="Check and generate upcoming event reminders")
def trigger_event_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Idempotent reminder check:
    Finds active events occurring within the next 48 hours and creates
    a reminder notification for each registered student if not already sent.
    """
    now = datetime.utcnow()
    reminder_window = now + timedelta(days=2)

    upcoming_events = db.query(EventModel).filter(
        EventModel.date_time >= now,
        EventModel.date_time <= reminder_window,
        EventModel.status != "Cancelled",
    ).all()

    reminders_sent = 0
    for evt in upcoming_events:
        active_regs = db.query(RegistrationModel).filter(
            RegistrationModel.event_id == evt.id,
            RegistrationModel.status == "registered",
        ).all()

        for reg in active_regs:
            # Check if reminder already sent for this event and student
            existing_reminder = db.query(models.NotificationModel).filter(
                models.NotificationModel.recipient_user_id == reg.student_id,
                models.NotificationModel.event_id == evt.id,
                models.NotificationModel.notification_type == "reminder",
            ).first()

            if not existing_reminder:
                evt_time_str = evt.date_time.strftime("%b %d at %I:%M %p") if evt.date_time else "soon"
                create_notification(
                    db=db,
                    recipient_user_id=reg.student_id,
                    title=f"Reminder: {evt.name} is coming up!",
                    message=f"Upcoming Event Reminder: {evt.name} takes place on {evt_time_str} at {evt.venue}. Please be on time with your ticket ({reg.ticket_id}).",
                    notification_type="reminder",
                    event_id=evt.id,
                )
                reminders_sent += 1

    return {"message": "Reminder scan complete", "reminders_sent": reminders_sent}
