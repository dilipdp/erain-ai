from pydantic import BaseModel, Field
from typing import Optional


class LeadContact(BaseModel):
    """Optional lead/contact details captured from the website form."""
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class BusinessProfile(BaseModel):
    company_name: str = Field(..., example="ABC Manufacturing Pvt Ltd")
    industry: str = Field(..., example="Manufacturing")
    employee_count: int = Field(..., example=120)
    annual_revenue_inr: Optional[float] = Field(None, example=250000000)


class OperationsSnapshot(BaseModel):
    major_processes: str = Field(
        ..., example="Procurement, Production, Quality, Dispatch"
    )
    known_issues: Optional[str] = Field(
        None, example="High rejection rate, procurement delays, downtime"
    )
    systems_used: Optional[str] = Field(
        None, example="Excel, Tally, SAP"
    )


class AuditRequest(BaseModel):
    business: BusinessProfile
    operations: OperationsSnapshot
    contact: Optional[LeadContact] = None