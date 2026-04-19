from fastapi import APIRouter, Depends, Header
from sqlmodel import Session, select
from typing import List, Dict, Any
from database import get_session
from models import Account
from crypto import decrypt
from meroshare_api import MeroShareAPI

from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class CheckRequest(BaseModel):
    company_share_id: Optional[int] = None
    account_id: Optional[int] = None

@router.get("/issues")
def get_recent_issues(session: Session = Depends(get_session)):
    """Fetch the latest IPO issues from local database history to populate dropdowns instantly"""
    from models import Application
    from sqlalchemy import desc
    
    # Get unique applications ordered by newest first
    stmt = select(Application.company_share_id, Application.company_name).distinct().order_by(desc(Application.company_share_id)).limit(20)
    results = session.exec(stmt).all()
    
    issues = []
    for share_id, name in results:
        issues.append({
            "company_share_id": share_id,
            "company_name": name,
            "scrip": ""
        })
    return issues

@router.post("/check")
def bulk_check(
    req: CheckRequest,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    """
    Live-check application + allotment status from MeroShare for every active account.
    Returns a list of per-account results, each containing their application entries
    with real status, allotted quantity, and remarks straight from MeroShare.
    """
    if req.account_id:
        accounts = session.exec(select(Account).where(Account.id == req.account_id, Account.active == True)).all()
    else:
        accounts = session.exec(select(Account).where(Account.active == True)).all()
        
    all_results = []

    for acc in accounts:
        acc_result = {
            "account_id": acc.id,
            "account_name": acc.name,
            "login_ok": False,
            "error": None,
            "applications": []
        }

        try:
            pw = decrypt(x_app_pin, acc.password)
            pin = decrypt(x_app_pin, acc.transaction_pin)
        except Exception:
            acc_result["error"] = "Decryption failed — wrong PIN?"
            all_results.append(acc_result)
            continue

        ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
        success, err = ms_api.login()

        if not success:
            acc_result["error"] = f"Login failed: {err}"
            all_results.append(acc_result)
            continue

        acc_result["login_ok"] = True

        # Fetch the full application history list
        try:
            history = ms_api.get_application_status()
        except Exception as e:
            acc_result["error"] = f"MeroShare API Crash: {str(e)}"
            acc_result["login_ok"] = False
            all_results.append(acc_result)
            continue
            
        if not history:
            acc_result["error"] = "MeroShare API returned empty data or 503 error."
            # We don't mark login_ok false here because they might genuinely have 0 applications
            all_results.append(acc_result)
            continue
            
        # We only fetch full details for the top 10 most recent IPOs to prevent massive MeroShare API timeout
        recent_history = history[:10]
        
        try:
            for idx, item in enumerate(recent_history):
                company_name = item.get("companyName", "Unknown")
                share_id = item.get("companyShareId")
                scrip = item.get("scrip", "")
                
                # If the user filtered by a specific issue, skip others
                if req.company_share_id is not None and share_id != req.company_share_id:
                    continue
                    
                list_status = item.get("statusName", "UNKNOWN")
                form_id = item.get("applicantFormId")

                # Fetch detail for each application to get rich status + remarks
                detail = {}
                if form_id:
                    try:
                        detail = ms_api.get_application_detail(form_id)
                    except Exception:
                        pass

                applied_kitta = detail.get("appliedKitta") or item.get("appliedKitta") or 10
                
                # MeroShare actually puts the real human-readable status in statusName, NOT statusDescription!
                # Examples: 'Rejected', 'Verified' (pending), 'Not Alloted', 'Alloted'
                status_raw = detail.get("statusName") or list_status or "UNKNOWN"
                status = str(status_raw).strip()

                # Parse allotted quantity from various MeroShare key spellings, primary is receivedKitta
                raw_allotted = (
                    detail.get("receivedKitta")
                    or detail.get("allottedKitta")
                    or detail.get("allotedQuantity")
                    or detail.get("allotedKitta")
                )
                allotted_kitta = None
                if raw_allotted is not None and str(raw_allotted).strip() != "":
                    try:
                        allotted_kitta = int(float(str(raw_allotted).strip()))
                    except (ValueError, TypeError):
                        pass

                # Remarks from detail
                remarks = detail.get("remarks") or detail.get("blockRemarks") or ""

                # Determine a clean display status
                status_upper = status.upper().replace(" ", "_")
                
                if status_upper in ("ALLOTTED", "ALLOTED"):
                    display_status = "ALLOTTED"
                    if allotted_kitta is None:
                        allotted_kitta = applied_kitta
                elif status_upper in ("NOT_ALLOTTED", "NOT_ALLOTED"):
                    display_status = "NOT_ALLOTTED"
                    allotted_kitta = 0
                elif status_upper in ("REJECTED", "BLOCK_FAILED", "TRANSACTION_FAILED"):
                    display_status = "FAILED"
                    allotted_kitta = 0
                    if not remarks:
                        remarks = status
                elif status_upper in ("VERIFIED", "BLOCKED", "TRANSACTION_SUCCESS"):
                    display_status = "PENDING"
                    if not remarks:
                        remarks = f"Amount Blocked" if "BLOCK" in status_upper else status
                else:
                    # Fallback
                    display_status = "PENDING"
                    if not remarks:
                        remarks = status

                acc_result["applications"].append({
                    "company_name": company_name,
                    "company_share_id": share_id,
                    "scrip": scrip,
                    "applied_kitta": applied_kitta,
                    "allotted_kitta": allotted_kitta,
                    "status": display_status,
                    "raw_status": status,
                    "remarks": remarks,
                })
        except Exception as outer_e:
            import traceback
            acc_result["error"] = f"CRITICAL CRASH: {str(outer_e)} - {traceback.format_exc()}"
            all_results.append(acc_result)
            continue
            
        all_results.append(acc_result)

    return all_results
