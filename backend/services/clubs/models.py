import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from ..event_services.database import Base

class ClubModel(Base):
    __tablename__ = "clubs"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    short_name = Column(String, nullable=True)
    category = Column(String, nullable=False)
    committee = Column(String, nullable=True)
    description = Column(String, nullable=True)
    lead = Column(String, nullable=True)
    faculty_coordinator = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    members_count = Column(Integer, default=1)
    tags_json = Column("tags", String, nullable=True)
    image = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def tags(self):
        if not self.tags_json:
            return []
        try:
            return json.loads(self.tags_json)
        except Exception:
            return [t.strip() for t in self.tags_json.split(",") if t.strip()]

    @tags.setter
    def tags(self, val):
        if isinstance(val, list):
            self.tags_json = json.dumps(val)
        elif isinstance(val, str):
            self.tags_json = json.dumps([t.strip() for t in val.split(",") if t.strip()])
        else:
            self.tags_json = "[]"
