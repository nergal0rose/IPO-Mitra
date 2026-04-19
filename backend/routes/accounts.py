from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Account
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
                if code == raw_dp or code.endswith(raw_dp):
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

class AccountResponse(BaseModel):
    id: int
    name: str
    dp_id: str
    username: str
    crn: str
    default_kitta: int
    group_label: str
    active: bool

@router.get("/capitals")
def get_capitals():
    try:
        r = requests.get('https://webbackend.cdsc.com.np/api/meroShare/capital/', timeout=10)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return []

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
        active=True
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    return account

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    account_in: AccountCreate,
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    try:
        enc_password = encrypt(x_app_pin, account_in.password)
        enc_pin = encrypt(x_app_pin, account_in.transaction_pin)
    except Exception:
        raise HTTPException(status_code=400, detail="Encryption failed. Invalid PIN?")

    account.name = account_in.name
    account.dp_id = resolve_dp_id(account_in.dp_id)
    account.username = account_in.username
    account.password = enc_password
    account.crn = account_in.crn
    account.transaction_pin = enc_pin
    account.default_kitta = account_in.default_kitta
    account.group_label = account_in.group_label
    
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
    
    session.delete(account)
    session.commit()
    return {"status": "deleted"}

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
