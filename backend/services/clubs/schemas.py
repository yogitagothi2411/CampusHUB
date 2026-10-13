from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ClubBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    category: str
    committee: Optional[str] = None
    description: Optional[str] = None
    lead: Optional[str] = None
    faculty_coordinator: Optional[str] = None
    contact_email: Optional[str] = None
    members_count: Optional[int] = 1
    tags: Optional[List[str]] = []
    image: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[str] = "Active"

class ClubCreate(ClubBase):
    id: Optional[str] = None

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    category: Optional[str] = None
    committee: Optional[str] = None
    description: Optional[str] = None
    lead: Optional[str] = None
    faculty_coordinator: Optional[str] = None
    contact_email: Optional[str] = None
    members_count: Optional[int] = None
    tags: Optional[List[str]] = None
    image: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[str] = None

class ClubRead(ClubBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
