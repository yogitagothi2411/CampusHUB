from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .database import Base

class EventModel(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    venue = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date_time = Column(DateTime, nullable=True)
    capacity = Column(Integer, nullable=True)
    status = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
