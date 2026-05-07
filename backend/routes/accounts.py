from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models import Account, Application, Portfolio
from crypto import encrypt, decrypt
from pydantic import BaseModel
from meroshare_api import MeroShareAPI
import requests

router = APIRouter()

def resolve_dp_id(raw_dp: str) -> str:
    """
    MeroShare internal API uses an internal ID (e.g. '199') instead of the public 
    routing DP ID (e.g. '13012500' or '12500' or '19400').
    This dynamically queries MeroShare's public capital endpoint to resolve it.
    """
    raw_dp = str(raw_dp).strip()
    try:
        r = requests.get('https://webbackend.cdsc.com.np/api/meroShare/capital/', timeout=10)
        if r.status_code == 200:
            capitals = r.json()
            # Quick pass: if it perfectly matches an existing ID, return it immediately to prevent substring collision
            for cap in capitals:
                if str(cap.get("id")) == raw_dp:
                    return raw_dp
                    
            # Try to match the exact code or if it ends with the user's input (e.g. '19400' in '13019400')
            for cap in capitals:
                code = str(cap.get("code", ""))
                # If exact match or trailing match
                if code == raw_dp or raw_dp.endswith(code):
                    res = str(cap.get("id"))
                    print("RESOLVED TO:", res)
                    return res
    except Exception as e:
        print("RESOLVE DP ERROR:", e)
    # If the user already provided the internal ID, or api failed, just return as-is
    print("FAILED TO MATCH, RETURNING:", raw_dp)
    return raw_dp

class AccountCreate(BaseModel):
    name: str
    dp_id: str
    username: str
    password: str
    crn: str
    transaction_pin: str
    default_kitta: int = 10
    group_label: str = "Family"
    active: bool = True
    is_primary: bool = False
    bank_id: Optional[int] = None
    bank_name: Optional[str] = ""

class AccountUpdate(BaseModel):
    name: str
    dp_id: str
    username: str
    password: str = ""
    crn: str
    transaction_pin: str = ""
    default_kitta: int = 10
    group_label: str = "Family"
    active: bool = True
    is_primary: bool = False
    bank_id: Optional[int] = None
    bank_name: Optional[str] = ""

class AccountResponse(BaseModel):
    id: int
    name: str
    dp_id: str
    username: str
    crn: str
    default_kitta: int
    group_label: str
    active: bool
    is_primary: bool
    bank_id: Optional[int] = None
    bank_name: Optional[str] = None

@router.get("/capitals")
def get_capitals():
    try:
        r = requests.get('https://webbackend.cdsc.com.np/api/meroShare/capital/', timeout=10)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return []

@router.get("/all-banks")
def get_all_banks():
    """Full C-ASBA bank list from MeroShare. Matched by name at apply time."""
    return [
        {"name": "Agriculture Development Bank Ltd."},
        {"name": "Best Finance Company Ltd."},
        {"name": "Central Finance Ltd."},
        {"name": "Citizens Bank International Ltd."},
        {"name": "Everest Bank Ltd."},
        {"name": "Excel Development Bank Ltd."},
        {"name": "Garima Bikas Bank Ltd."},
        {"name": "Global IME Bank Ltd."},
        {"name": "Goodwill Finance Ltd."},
        {"name": "Green Development Bank Ltd."},
        {"name": "Guheshwori Merchant Banking Finance Ltd."},
        {"name": "Gurkhas Finance Ltd."},
        {"name": "Himalayan Bank Ltd."},
        {"name": "ICFC Finance Ltd."},
        {"name": "Jyoti Bikash Bank Ltd."},
        {"name": "Kamana Sewa Bikas Bank Ltd."},
        {"name": "Kumari Bank Ltd."},
        {"name": "LAXMI SUNRISE BANK LIMITED."},
        {"name": "Lumbini Bikas Bank Ltd."},
        {"name": "Machhapuchhre Bank Ltd."},
        {"name": "Mahalaxmi Bikas Bank Limited."},
        {"name": "Manjushree Financial Institution Ltd."},
        {"name": "Muktinath Bikas Bank Ltd."},
        {"name": "Nabil Bank Ltd."},
        {"name": "Nepal Bank Ltd."},
        {"name": "Nepal Investment Mega Bank Ltd."},
        {"name": "Nepal SBI Bank Ltd."},
        {"name": "NIC Asia Bank Ltd."},
        {"name": "NMB Bank Ltd."},
        {"name": "Pokhara Finance Ltd."},
        {"name": "Prabhu Bank Ltd."},
        {"name": "Prime Commercial Bank Ltd."},
        {"name": "Progressive Finance Co. Ltd."},
        {"name": "Rastriya Banijya Bank Ltd."},
        {"name": "Reliance Finance Ltd."},
        {"name": "Sanima Bank Ltd."},
        {"name": "Saptakoshi Development Bank Ltd."},
        {"name": "Shangri-la Development Bank Ltd."},
        {"name": "Shine Resunga Development Bank Ltd."},
        {"name": "Shree Investment & Finance Co. Ltd."},
        {"name": "Siddhartha Bank Ltd."},
        {"name": "Sindhu Bikash Bank Ltd."},
        {"name": "Standard Chartered Bank Nepal Ltd."},
    ]



@router.get("/", response_model=List[AccountResponse])
def get_accounts(session: Session = Depends(get_session)):
    accounts = session.exec(select(Account)).all()
    return accounts

@router.post("/", response_model=AccountResponse)
def create_account(
    account_in: AccountCreate,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    try:
        enc_password = encrypt(x_app_pin, account_in.password)
        enc_pin = encrypt(x_app_pin, account_in.transaction_pin)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Encryption failed. Invalid PIN?")
    
    account = Account(
        name=account_in.name,
        dp_id=resolve_dp_id(account_in.dp_id),
        username=account_in.username,
        password=enc_password,
        crn=account_in.crn,
        transaction_pin=enc_pin,
        default_kitta=account_in.default_kitta,
        group_label=account_in.group_label,
        active=account_in.active,
        is_primary=account_in.is_primary,
        bank_id=account_in.bank_id,
        bank_name=account_in.bank_name
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    return account

@router.post("/change-pin")
def change_pin(
    payload: dict,
    session: Session = Depends(get_session)
):
    old_pin = payload.get("old_pin")
    new_pin = payload.get("new_pin")
    if not old_pin or not new_pin:
        raise HTTPException(status_code=400, detail="Missing pins")
        
    accounts = session.exec(select(Account)).all()
    # verify first
    for acc in accounts:
        try:
            decrypt(old_pin, acc.password)
        except Exception:
            raise HTTPException(status_code=400, detail="Incorrect current PIN. Decryption failed.")
            
    # now re-encrypt
    for acc in accounts:
        raw_pw = decrypt(old_pin, acc.password)
        raw_tx = decrypt(old_pin, acc.transaction_pin)
        acc.password = encrypt(new_pin, raw_pw)
        acc.transaction_pin = encrypt(new_pin, raw_tx)
        session.add(acc)
    session.commit()
    return {"status": "success"}

@router.get("/check-setup")
def check_setup(session: Session = Depends(get_session)):
    acc = session.exec(select(Account).limit(1)).first()
    return {"has_pin": acc is not None}

@router.post("/set-pin")
def set_pin(payload: dict):
    # PIN is not stored globally, it is used as an encryption key.
    # Just validate and acknowledge.
    pin = payload.get("pin")
    if not pin or len(str(pin)) != 4 or not str(pin).isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    return {"status": "ok"}

@router.post("/verify-pin")
def verify_pin(
    payload: dict,
    session: Session = Depends(get_session)
):
    pin = payload.get("pin")
    if not pin or len(str(pin)) != 4 or not str(pin).isdigit():
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")
        
    acc = session.exec(select(Account).limit(1)).first()
    if not acc:
        return {"status": "ok"}
        
    try:
        decrypt(pin, acc.password)
        return {"status": "ok"}
    except Exception:
        raise HTTPException(status_code=401, detail="Incorrect PIN")

@router.delete("/wipe")
def wipe_all(session: Session = Depends(get_session)):
    try:
        session.exec(select(Application)).all() # check
        apps = session.exec(select(Application)).all()
        for a in apps: session.delete(a)
        ports = session.exec(select(Portfolio)).all()
        for p in ports: session.delete(p)
        accs = session.exec(select(Account)).all()
        for c in accs: session.delete(c)
        session.commit()
        return {"status": "success"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    account_in: AccountUpdate,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if account_in.password:
        try:
            account.password = encrypt(x_app_pin, account_in.password)
        except Exception:
            raise HTTPException(status_code=400, detail="Encryption failed. Invalid PIN?")
            
    if account_in.transaction_pin:
        try:
            account.transaction_pin = encrypt(x_app_pin, account_in.transaction_pin)
        except Exception:
            raise HTTPException(status_code=400, detail="Encryption failed. Invalid PIN?")

    account.name = account_in.name
    account.dp_id = resolve_dp_id(account_in.dp_id)
    account.username = account_in.username
    account.crn = account_in.crn
    account.default_kitta = account_in.default_kitta
    account.group_label = account_in.group_label
    account.active = account_in.active
    account.is_primary = account_in.is_primary
    if account_in.bank_id:
        account.bank_id = account_in.bank_id
    if account_in.bank_name:
        account.bank_name = account_in.bank_name
    
    session.add(account)
    session.commit()
    session.refresh(account)
    return account

@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    session: Session = Depends(get_session)
):
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        apps = session.exec(select(Application).where(Application.account_id == account_id)).all()
        for app in apps:
            session.delete(app)
            
        ports = session.exec(select(Portfolio).where(Portfolio.account_id == account_id)).all()
        for p in ports:
            session.delete(p)
        
        session.delete(account)
        session.commit()
        return {"status": "deleted"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.patch("/{account_id}/toggle-active", response_model=AccountResponse)
def toggle_active(
    account_id: int,
    session: Session = Depends(get_session)
):
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.active = not account.active
    session.add(account)
    session.commit()
    session.refresh(account)
    return account

@router.post("/health-check")
def health_check(
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    accounts = session.exec(select(Account).where(Account.active == True)).all()
    results = []
    for acc in accounts:
        try:
            pw = decrypt(x_app_pin, acc.password)
            pin = decrypt(x_app_pin, acc.transaction_pin)
            ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
            success, error_msg = ms_api.login()
            results.append({
                "id": acc.id,
                "name": acc.name,
                "status": "OK" if success else "FAILED",
                "error": error_msg
            })
        except Exception as e:
            results.append({"id": acc.id, "name": acc.name, "status": "ERROR", "error": str(e)})
    return results

@router.get("/{account_id}/bank-detail")
def get_account_bank_detail(
    account_id: int,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    acc = session.get(Account, account_id)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    try:
        pw = decrypt(x_app_pin, acc.password)
        pin = decrypt(x_app_pin, acc.transaction_pin)
        ms = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
        ms.login()
        ms.get_bank_detail()
        if ms.bank_id is None:
            return {"bank": None}
        # Fetch the bank name from the capital list
        import requests as req
        banks_r = req.get("https://webbackend.cdsc.com.np/api/meroShare/bank/", headers=ms._headers(), timeout=10)
        banks = banks_r.json() if banks_r.status_code == 200 else []
        bank_name = next((b.get("name") for b in banks if b.get("id") == ms.bank_id), f"Bank {ms.bank_id}")
        return {
            "bank": {
                "bankId": ms.bank_id,
                "bankName": bank_name,
                "accountNumber": ms.bank_account_number,
                "branchId": ms.account_branch_id,
                "accountTypeId": ms.account_type_id,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{account_id}/secrets")
def get_account_secrets(
    account_id: int,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    acc = session.get(Account, account_id)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    try:
        pw = decrypt(x_app_pin, acc.password)
        pin = decrypt(x_app_pin, acc.transaction_pin)
        return {"password": pw, "transaction_pin": pin}
    except Exception:
        raise HTTPException(status_code=401, detail="Incorrect PIN")

@router.post("/{account_id}/health")
def single_health_check(
    account_id: int,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    acc = session.get(Account, account_id)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    try:
        pw = decrypt(x_app_pin, acc.password)
        pin = decrypt(x_app_pin, acc.transaction_pin)
        ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
        success, error_msg = ms_api.login()
        return {
            "id": acc.id,
            "name": acc.name,
            "status": "OK" if success else "FAILED",
            "error": error_msg
        }
    except Exception as e:
        return {"id": acc.id, "name": acc.name, "status": "ERROR", "error": str(e)}

@router.patch("/{account_id}/set-primary", response_model=AccountResponse)
def set_primary(
    account_id: int,
    session: Session = Depends(get_session)
):
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    was_primary = account.is_primary
    
    # Reset all accounts
    all_accounts = session.exec(select(Account)).all()
    for acc in all_accounts:
        acc.is_primary = False
        session.add(acc)
    
    # Toggle primary for this account
    if not was_primary:
        account.is_primary = True
        session.add(account)
        
    session.commit()
    session.refresh(account)
    return account
