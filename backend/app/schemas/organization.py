# app/schemas/organization.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class OrganizationBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None


class OrganizationRead(OrganizationBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MembershipRead(BaseModel):
    id: UUID
    user_id: UUID
    organization_id: UUID
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}
