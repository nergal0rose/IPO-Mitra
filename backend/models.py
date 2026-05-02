from typing import Optional
from datetime import datetime, date
from sqlmodel import SQLModel, Field

class Account(SQLModel, table=True):
    __tablename__ = "accounts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dp_id: str
    username: str
    password: str  # AES encrypted
    crn: str
    transaction_pin: str  # AES encrypted
    default_kitta: int = Field(default=10)
    group_label: str = Field(default="Family")
    active: bool = Field(default=True)
    is_primary: bool = Field(default=False)
    bank_id: Optional[int] = Field(default=None)
    bank_name: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Application(SQLModel, table=True):
    __tablename__ = "applications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="accounts.id")
    company_name: str
    company_share_id: int
    applied_kitta: int
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    status: str  # PENDING / ALLOTTED / NOT_ALLOTTED / FAILED
    allotted_kitta: Optional[int] = None
    raw_response: Optional[str] = None  # full JSON stored for debugging

class IPOOverride(SQLModel, table=True):
    __tablename__ = "ipo_overrides"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_keyword: str  # matched case-insensitively
    action: str  # SKIP | PRIORITY
    kitta_override: Optional[int] = None  # NULL = use account default

class Portfolio(SQLModel, table=True):
    __tablename__ = "portfolio"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="accounts.id")
    company_name: str
    allotted_kitta: int
    offer_price: float
    listing_date: Optional[date] = None
    listing_price: Optional[float] = None
    current_price: Optional[float] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SchedulerRun(SQLModel, table=True):
    __tablename__ = "scheduler_runs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    run_at: datetime = Field(default_factory=datetime.utcnow)
    status: str  # SUCCESS | PARTIAL | FAILED
    summary: Optional[str] = None  # JSON: {applied, skipped, failed}
    log: Optional[str] = None
