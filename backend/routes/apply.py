from fastapi import APIRouter, Depends, Header
from sqlmodel import Session, select
from typing import List, Dict, Any
from database import get_session
from models import Account, Application
from meroshare_api import MeroShareAPI
from crypto import decrypt

from pydantic import BaseModel

router = APIRouter()

class ApplyRequest(BaseModel):
    account_ids: List[int]
    ipos: List[Dict[str, Any]]
    dry_run: bool = False

@router.post("/bulk")
def bulk_apply(
    req: ApplyRequest,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    results = []
    
    for acc_id in req.account_ids:
        acc = session.get(Account, acc_id)
        if not acc or not acc.active: continue

        try:
            pw = decrypt(x_app_pin, acc.password)
            pin = decrypt(x_app_pin, acc.transaction_pin)
            ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin, bank_name=acc.bank_name)
            
            # Login check
            success, err = ms_api.login()
            if not success:
                for ipo in req.ipos:
                    results.append({
                        "account": acc.name,
                        "company": ipo.get("companyName"),
                        "status": "FAILED",
                        "message": f"Login failed: {err}"
                    })
                continue

            for ipo_req in req.ipos:
                company_name = ipo_req.get("companyName", "Unknown")
                kitta = acc.default_kitta or 10
                
                print(f"Applying for {acc.name} -> {company_name}...")
                
                # Auto-retry logic for Bank Timeouts (Invalid CRN)
                max_retries = 3
                import time
                res = None
                
                for attempt in range(max_retries):
                    res = ms_api.apply_ipo(ipo_req, kitta, dry_run=req.dry_run)
                    if res.get("status") == "FAILED" and "Invalid CRN" in res.get("message", ""):
                        print(f"Bank Timeout for {acc.name} (Attempt {attempt+1}/{max_retries}). Retrying in 10s...")
                        time.sleep(10)
                        continue
                    break # Success or permanent error
                
                if res.get("status") == "FAILED" and "Invalid CRN" in res.get("message", ""):
                    res["message"] = "Bank Server Timeout. Please try again later."
                
                results.append({
                    "account": acc.name,
                    "company": company_name,
                    "kitta": kitta,
                    "status": res.get("status"),
                    "message": res.get("message")
                })

                # Persist to DB
                share_id = ipo_req.get("id") or ipo_req.get("companyShareId") or 0
                existing = session.exec(
                    select(Application).where(Application.account_id == acc.id, Application.company_share_id == share_id)
                ).first()
                
                db_status = "PENDING" if res.get("status") == "SUCCESS" else res.get("status")

                if not existing:
                    session.add(Application(
                        account_id=acc.id,
                        company_name=company_name,
                        company_share_id=share_id,
                        applied_kitta=kitta,
                        status=db_status,
                        raw_response=res.get("message")
                    ))
                    session.commit()
                else:
                    # Update status if we tried again (e.g. FAILED -> PENDING, or PENDING -> ALREADY_APPLIED)
                    existing.status = db_status
                    existing.raw_response = res.get("message")
                    from datetime import datetime
                    existing.applied_at = datetime.utcnow()
                    session.add(existing)
                    session.commit()
        except Exception as e:
            results.append({
                "account": acc.name,
                "status": "FAILED",
                "message": f"CRITICAL: {str(e)}"
            })

    return results
