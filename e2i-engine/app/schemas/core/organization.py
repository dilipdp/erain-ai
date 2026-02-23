from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    legal_name: str | None = Field(default=None, max_length=300)
    domain: str | None = Field(default=None, max_length=255)


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    legal_name: str | None
    domain: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}