from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    recipient_user_id: int
    title: str
    message: str
    notification_type: Optional[str] = "general"
    event_id: Optional[int] = None

class NotificationRead(BaseModel):
    id: int
    recipient_user_id: int
    title: str
    message: str
    notification_type: str
    event_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UnreadCountResponse(BaseModel):
    unread_count: int

class MarkAllReadResponse(BaseModel):
    message: str
    updated_count: int
