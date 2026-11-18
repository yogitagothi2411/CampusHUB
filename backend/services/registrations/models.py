from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from ..event_services.database import Base

class RegistrationModel(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    student_name = Column(String, nullable=True)
    student_email = Column(String, nullable=True)
    student_roll = Column(String, nullable=True)
    department = Column(String, nullable=True)
    ticket_id = Column(String, unique=True, index=True, nullable=True)
    status = Column(String, default="registered", nullable=False)  # 'registered' | 'cancelled'
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
