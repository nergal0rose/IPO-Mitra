import requests
from sqlmodel import Session, select
from database import engine
from models import Account
from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL

with Session(engine) as session:
    acc = session.exec(select(Account)).first()
    pw = decrypt('1234', acc.password)
    pin = decrypt('1234', acc.transaction_pin)
    api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
    api.login()
    api.get_bank_detail()
    api.get_own_detail()

    payload = {
        "accountBranchId": api.account_branch_id,
        "accountNumber": api.bank_account_number,
        "appliedKitta": "10",
        "bankId": api.bank_id,
        "boid": api.own_detail.get("boid") if api.own_detail else None,
        "companyShareId": 770,
        "crnNumber": api.crn,
        "customerId": api.own_detail.get("id") if api.own_detail else None,
        "demat": api.own_detail.get("demat") if api.own_detail else None,
        "transactionPIN": pin,
    }

    print("Testing WITH trailing slash:")
    r1 = api.session.post(f"{BASE_URL}/applicantForm/", json=payload, headers=api._headers())
    print(f"Status: {r1.status_code}, Body starts: {r1.text[:100]}")

    print("\nTesting WITHOUT trailing slash:")
    r2 = api.session.post(f"{BASE_URL}/applicantForm", json=payload, headers=api._headers())
    print(f"Status: {r2.status_code}, Body starts: {r2.text[:100]}")
