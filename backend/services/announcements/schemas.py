from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AnnouncementBase(BaseModel):
    title: str
    body: str
    category: Optional[str] = "General"
    is_published: Optional[bool] = True

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None

class AnnouncementRead(BaseModel):
    id: int
    title: str
    body: str
    category: str
    published_by_user_id: int
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
