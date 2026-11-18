from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Arjun Mehta"})
    email: EmailStr = Field(..., json_schema_extra={"example": "student@college.edu"})
    password: str = Field(..., min_length=6, json_schema_extra={"example": "StrongPass123"})
    role: str = Field(default="student", pattern="^(student|organizer)$", json_schema_extra={"example": "student"})

class AdminProvisionRequest(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Admin User"})
    email: EmailStr = Field(..., json_schema_extra={"example": "admin@college.edu"})
    password: str = Field(..., min_length=6, json_schema_extra={"example": "AdminSecret123"})
    admin_secret: str = Field(..., json_schema_extra={"example": "iiitv-admin-secret-2024"})

class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
