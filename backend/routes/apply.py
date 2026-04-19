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
            ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
            
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
                res = ms_api.apply_ipo(ipo_req, kitta, dry_run=req.dry_run)
                
                results.append({
                    "account": acc.name,
                    "company": company_name,
                    "kitta": kitta,
                    "status": res.get("status"),
                    "message": res.get("message")
                })
        except Exception as e:
            results.append({
                "account": acc.name,
                "status": "FAILED",
                "message": f"CRITICAL: {str(e)}"
            })

    return results
