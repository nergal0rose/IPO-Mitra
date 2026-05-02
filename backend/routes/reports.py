from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import List, Dict, Any
from database import get_session
from models import Account, Application
from crypto import decrypt
from meroshare_api import MeroShareAPI
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ReportItem(BaseModel):
    id: int | None = None
    account_id: int
    account_name: str
    company_name: str
    company_share_id: int
    applied_kitta: int
    allotted_kitta: int | None
    status: str
    applied_at: datetime | str

@router.post("/sync", response_model=Dict[str, Any])
def sync_reports(
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    """
    Sync application history directly from MeroShare for all active accounts.
    Updates the local SQLite database to reflect allotments and statuses natively.
    """
    accounts = session.exec(select(Account).where(Account.active == True)).all()
    results = {"success": 0, "failed": 0, "details": []}
    
    # Track which accounts updated what to print in success/failure
    
    for acc in accounts:
        try:
            pw = decrypt(x_app_pin, acc.password)
            pin = decrypt(x_app_pin, acc.transaction_pin)
            ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin, bank_name=acc.bank_name)
            success, err = ms_api.login()
            
            if not success:
                results["failed"] += 1
                results["details"].append(f"{acc.name}: Login Failed ({err})")
                continue
                
            history = ms_api.get_application_status()
            
            for item in history:
                company_name = item.get("companyName", "Unknown Company")
                share_id = item.get("companyShareId")
                list_status = item.get("statusName", "UNKNOWN")
                form_id = item.get("applicantFormId")
                
                # Always fetch detail to get accurate appliedKitta, appliedDate, statusName
                detail = {}
                if form_id:
                    try:
                        detail = ms_api.get_application_detail(form_id)
                    except Exception:
                        pass
                
                applied_kitta = detail.get("appliedKitta") or 10
                status_raw = detail.get("statusDescription") or list_status or "UNKNOWN"
                status = str(status_raw).replace(" ", "_").upper()
                
                # Derive allotted_kitta from status when detail API doesn't provide it
                raw_allotted = detail.get("allottedKitta") or detail.get("allotedQuantity") or detail.get("allotedKitta")
                
                allotted_kitta = None
                
                if raw_allotted is not None and str(raw_allotted).strip() != "":
                    try:
                        allotted_kitta = int(float(str(raw_allotted).strip()))
                    except ValueError:
                        pass
                
                if allotted_kitta is None:
                    if status in ("BLOCK_FAILED", "REJECTED", "NOT_ALLOTTED", "NOT_ALLOTED", "TRANSACTION_FAILED"):
                        allotted_kitta = 0
                    elif status in ("ALLOTTED", "ALLOTED"):
                        allotted_kitta = applied_kitta  # assume full allotment if not specified
                    elif status in ("TRANSACTION_SUCCESS", "VERIFIED", "BLOCKED"):
                        allotted_kitta = None  # still pending
                    else:
                        allotted_kitta = None
                
                applied_date = detail.get("appliedDate")
                
                app_in_db = session.exec(
                    select(Application).where(Application.account_id == acc.id, Application.company_share_id == share_id)
                ).first()
                
                if app_in_db:
                    app_in_db.company_name = company_name
                    app_in_db.applied_kitta = applied_kitta
                    app_in_db.allotted_kitta = allotted_kitta
                    app_in_db.status = status
                    if applied_date:
                        try:
                            app_in_db.applied_at = datetime.fromisoformat(applied_date.replace("Z", "+00:00"))
                        except Exception:
                            pass
                    session.add(app_in_db)
                else:
                    new_app = Application(
                        account_id=acc.id,
                        company_name=company_name,
                        company_share_id=share_id or 0,
                        applied_kitta=applied_kitta,
                        allotted_kitta=allotted_kitta,
                        status=status
                    )
                    if applied_date:
                        try:
                            new_app.applied_at = datetime.fromisoformat(applied_date.replace("Z", "+00:00"))
                        except Exception:
                            pass
                    session.add(new_app)
                    
            session.commit()
            results["success"] += 1
            
        except Exception as e:
            results["failed"] += 1
            results["details"].append(f"{acc.name}: Exception ({str(e)})")
            
    return results

@router.get("/", response_model=List[ReportItem])
def get_reports(session: Session = Depends(get_session)):
    """
    Fetch all application history from the local database.
    """
    applications = session.exec(select(Application, Account).join(Account).order_by(Application.applied_at.desc())).all()
    out = []
    for app, acc in applications:
        out.append(
            ReportItem(
                id=app.id,
                account_id=acc.id,
                account_name=acc.name,
                company_name=app.company_name,
                company_share_id=app.company_share_id,
                applied_kitta=app.applied_kitta,
                allotted_kitta=app.allotted_kitta,
                status=app.status,
                applied_at=app.applied_at
            )
        )
    return out
