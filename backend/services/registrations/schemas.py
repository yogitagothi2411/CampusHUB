from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class RegistrationCreate(BaseModel):
    student_roll: Optional[str] = None
    department: Optional[str] = None
    student_name: Optional[str] = None

class RegistrationRead(BaseModel):
    id: int
    event_id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_roll: Optional[str] = None
    department: Optional[str] = None
    ticket_id: Optional[str] = None
    status: str
    registered_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RegistrationWithEventRead(RegistrationRead):
    event_name: Optional[str] = None
    event_category: Optional[str] = None
    event_venue: Optional[str] = None
    event_date_time: Optional[datetime] = None

class MyEventRegistrationStatus(BaseModel):
    is_registered: bool
    registration: Optional[RegistrationRead] = None
