import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ..event_services.database import get_db
from . import schemas, models, security
from .dependencies import get_current_active_user

router = APIRouter()

ADMIN_PROVISION_SECRET = os.getenv("ADMIN_PROVISION_SECRET", "iiitv-admin-secret-2024")

@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Explicit safeguard against admin role in public registration
    if user.role not in ["student", "organizer"] or user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration cannot create admin accounts. Only 'student' and 'organizer' roles are allowed.",
        )

    normalized_email = user.email.strip().lower()
    existing = db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_obj = models.User(
        name=user.name.strip(),
        email=normalized_email,
        password_hash=security.get_password_hash(user.password),
        role=user.role,
        is_active=True,
    )
    db.add(user_obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    db.refresh(user_obj)
    return user_obj

@router.post("/provision-admin", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def provision_admin(req: schemas.AdminProvisionRequest, db: Session = Depends(get_db)):
    if req.admin_secret != ADMIN_PROVISION_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin provisioning secret",
        )

    normalized_email = req.email.strip().lower()
    existing = db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    admin_user = models.User(
        name=req.name.strip(),
        email=normalized_email,
        password_hash=security.get_password_hash(req.password),
        role="admin",
        is_active=True,
    )
    db.add(admin_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    db.refresh(admin_user)
    return admin_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    normalized_username = form_data.username.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == normalized_username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserRead)
def get_current_user_profile(current_user: models.User = Depends(get_current_active_user)):
    return current_user
