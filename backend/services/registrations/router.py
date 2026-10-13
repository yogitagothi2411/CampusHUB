import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..event_services.database import get_db
from ..event_services.models import EventModel
from ..auth.dependencies import role_required, get_current_active_user
from ..auth.models import User
from . import models, schemas

router = APIRouter(tags=["Registrations"])

@router.post(
    "/events/{event_id}/registrations",
    response_model=schemas.RegistrationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register student for an event",
)
def register_for_event(
    event_id: int = Path(..., ge=1),
    reg_in: Optional[schemas.RegistrationCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("student")),
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    if event.status and event.status.lower() in ["completed", "cancelled", "closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot register for an event with status '{event.status}'",
        )

    # Check for existing registration by this student
    existing_reg = db.query(models.RegistrationModel).filter(
        models.RegistrationModel.event_id == event_id,
        models.RegistrationModel.student_id == current_user.id,
    ).first()

    if existing_reg and existing_reg.status == "registered":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already registered for this event",
        )

    # Check capacity limit
    active_count = db.query(func.count(models.RegistrationModel.id)).filter(
        models.RegistrationModel.event_id == event_id,
        models.RegistrationModel.status == "registered",
    ).scalar() or 0

    if event.capacity is not None and active_count >= event.capacity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event registration limit reached. The event is full.",
        )

    # Details to save
    s_name = (reg_in and reg_in.student_name) or current_user.name
    s_roll = (reg_in and reg_in.student_roll) or "202351001"
    s_dept = (reg_in and reg_in.department) or "CSE"

    if existing_reg:
        # Re-activate previously cancelled registration
        existing_reg.status = "registered"
        existing_reg.student_name = s_name
        existing_reg.student_email = current_user.email
        existing_reg.student_roll = s_roll
        existing_reg.department = s_dept
        db.commit()
        db.refresh(existing_reg)

        # Notify student of confirmation
        try:
            from ..notifications.router import create_notification
            create_notification(
                db=db,
                recipient_user_id=current_user.id,
                title=f"Registration Confirmed: {event.name}",
                message=f"Your registration for '{event.name}' has been reactivated. Ticket ID: {existing_reg.ticket_id}.",
                notification_type="registration",
                event_id=event.id,
            )
        except Exception:
            pass

        return existing_reg

    # Create brand new registration
    ticket_id = f"CEH-{event_id}-{secrets.token_hex(3).upper()}"
    new_reg = models.RegistrationModel(
        event_id=event_id,
        student_id=current_user.id,
        student_name=s_name,
        student_email=current_user.email,
        student_roll=s_roll,
        department=s_dept,
        ticket_id=ticket_id,
        status="registered",
    )
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)

    # Notify student of confirmation
    try:
        from ..notifications.router import create_notification
        create_notification(
            db=db,
            recipient_user_id=current_user.id,
            title=f"Registration Confirmed: {event.name}",
            message=f"You have successfully registered for '{event.name}'. Ticket ID: {new_reg.ticket_id}.",
            notification_type="registration",
            event_id=event.id,
        )
    except Exception:
        pass

    return new_reg

@router.get(
    "/events/{event_id}/registrations/me",
    response_model=schemas.MyEventRegistrationStatus,
    summary="Get current student's registration status for an event",
)
def get_my_event_registration(
    event_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("student")),
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    reg = db.query(models.RegistrationModel).filter(
        models.RegistrationModel.event_id == event_id,
        models.RegistrationModel.student_id == current_user.id,
        models.RegistrationModel.status == "registered",
    ).first()

    if reg:
        return {"is_registered": True, "registration": reg}
    return {"is_registered": False, "registration": None}

@router.delete(
    "/events/{event_id}/registrations/me",
    summary="Cancel current student's registration for an event",
)
def cancel_my_event_registration(
    event_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("student")),
):
    reg = db.query(models.RegistrationModel).filter(
        models.RegistrationModel.event_id == event_id,
        models.RegistrationModel.student_id == current_user.id,
        models.RegistrationModel.status == "registered",
    ).first()

    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active registration found for this event",
        )

    reg.status = "cancelled"
    db.commit()

    # Notify student of cancellation
    try:
        event = db.query(EventModel).filter(EventModel.id == event_id).first()
        event_name = event.name if event else f"Event #{event_id}"
        from ..notifications.router import create_notification
        create_notification(
            db=db,
            recipient_user_id=current_user.id,
            title=f"Registration Cancelled: {event_name}",
            message=f"Your registration for '{event_name}' has been cancelled.",
            notification_type="cancellation",
            event_id=event_id,
        )
    except Exception:
        pass

    return {"message": "Registration cancelled successfully", "status": "cancelled"}

@router.get(
    "/registrations/me",
    response_model=List[schemas.RegistrationWithEventRead],
    summary="List all active registrations for current student",
)
def list_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("student")),
):
    regs = db.query(models.RegistrationModel, EventModel).join(
        EventModel, models.RegistrationModel.event_id == EventModel.id
    ).filter(
        models.RegistrationModel.student_id == current_user.id,
        models.RegistrationModel.status == "registered",
    ).all()

    results = []
    for reg, event in regs:
        results.append(
            schemas.RegistrationWithEventRead(
                id=reg.id,
                event_id=reg.event_id,
                student_id=reg.student_id,
                student_name=reg.student_name,
                student_email=reg.student_email,
                student_roll=reg.student_roll,
                department=reg.department,
                ticket_id=reg.ticket_id,
                status=reg.status,
                registered_at=reg.registered_at,
                event_name=event.name,
                event_category=event.category,
                event_venue=event.venue,
                event_date_time=event.date_time,
            )
        )
    return results

@router.get(
    "/events/{event_id}/registrations",
    response_model=List[schemas.RegistrationRead],
    summary="List attendees for an event (Authorized organizer or Admin only)",
)
def list_event_attendees(
    event_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    # Permission check: Admin or event owner
    if current_user.role != "admin" and (
        current_user.role != "organizer" or event.owner_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view attendees for this event",
        )

    attendees = db.query(models.RegistrationModel).filter(
        models.RegistrationModel.event_id == event_id,
        models.RegistrationModel.status == "registered",
    ).all()

    return attendees
