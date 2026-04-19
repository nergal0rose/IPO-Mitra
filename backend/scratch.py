"""Direct sync test - bypasses the web API to test the sync logic correctly."""
from sqlmodel import Session, select
from database import engine
from models import Account, Application
from crypto import decrypt
from meroshare_api import MeroShareAPI
from datetime import datetime

PIN = "1234"

def sync():
    with Session(engine) as session:
        accounts = session.exec(select(Account).where(Account.active == True)).all()
        print(f"Found {len(accounts)} active account(s)")
        
        for acc in accounts:
            print(f"\n--- Syncing: {acc.name} (DP: {acc.dp_id}) ---")
            pw = decrypt(PIN, acc.password)
            pin = decrypt(PIN, acc.transaction_pin)
            ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
            
            success, err = ms_api.login()
            if not success:
                print(f"  Login FAILED: {err}")
                continue
            
            history = ms_api.get_application_status()
            print(f"  Got {len(history)} history items")
            
            synced = 0
            for item in history:
                company_name = item.get("companyName", "Unknown Company")
                share_id = item.get("companyShareId")
                list_status = item.get("statusName", "UNKNOWN")
                form_id = item.get("applicantFormId")
                
                # Fetch detail for accurate data
                detail = {}
                if form_id:
                    try:
                        detail = ms_api.get_application_detail(form_id)
                    except Exception as e:
                        print(f"    Detail fetch failed for {form_id}: {e}")
                
                applied_kitta = detail.get("appliedKitta", 10)
                allotted_kitta = detail.get("allottedKitta")
                status = detail.get("statusDescription", list_status).replace(" ", "_")
                applied_date = detail.get("appliedDate")
                
                # Check if exists
                existing = session.exec(
                    select(Application).where(
                        Application.account_id == acc.id,
                        Application.company_share_id == share_id
                    )
                ).first()
                
                if existing:
                    existing.company_name = company_name
                    existing.applied_kitta = applied_kitta
                    existing.allotted_kitta = allotted_kitta
                    existing.status = status
                    if applied_date:
                        try:
                            existing.applied_at = datetime.fromisoformat(applied_date.replace("Z", "+00:00"))
                        except:
                            pass
                    session.add(existing)
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
                        except:
                            pass
                    session.add(new_app)
                
                synced += 1
                if synced <= 3:
                    print(f"  [{synced}] {company_name} | kitta={applied_kitta} | status={status} | date={applied_date}")
            
            session.commit()
            print(f"  Synced {synced} entries total")
        
        # Final check
        total = session.exec(select(Application)).all()
        print(f"\n=== DB now has {len(total)} total entries ===")
        for a in total[:5]:
            print(f"  {a.company_name} | kitta={a.applied_kitta} | status={a.status} | date={a.applied_at}")

if __name__ == "__main__":
    sync()
