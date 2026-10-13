from pydantic import BaseModel, Field, ConfigDict

class RegistrationCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    eventId: str = Field(min_length=1, max_length=100)
    studentReference: str = Field(min_length=1, max_length=100)

class RegistrationUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    studentReference: str = Field(min_length=1, max_length=100)

class Registration(BaseModel):
    id: str
    eventId: str
    studentReference: str
    status: str = "CONFIRMED"
