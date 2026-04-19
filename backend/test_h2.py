import httpx
import json
from sqlmodel import Session, select
from database import engine
from models import Account
from crypto import decrypt
from meroshare_api import HEADERS_BASE, BASE_URL

with Session(engine) as session:
    acc = session.exec(select(Account)).first()
    pw = decrypt('1234', acc.password)
    pin = decrypt('1234', acc.transaction_pin)
    
    # Use httpx client with HTTP/2
    with httpx.Client(http2=True, headers=HEADERS_BASE) as client:
        # Login
        r_login = client.post(f"{BASE_URL}/auth/", json={
            "clientId": acc.dp_id,
            "username": acc.username,
            "password": pw
        })
        token = r_login.headers.get("Authorization")
        print(f"Login: {r_login.status_code}")
        
        client.headers["Authorization"] = token

        # Get own detail
        r_own = client.get(f"{BASE_URL}/ownDetail/")
        own_detail = r_own.json()
        print(f"OwnDetail: {r_own.status_code}")

        # Get bank detail
        r_bank = client.get(f"{BASE_URL}/bank/")
        banks = r_bank.json()
        bank_id = banks[0]["id"]
        r_bank_detail = client.get(f"{BASE_URL}/bank/{bank_id}/")
        detail = r_bank_detail.json()
        if isinstance(detail, list): detail = detail[0]
        acc_num = detail["accountNumber"]
        branch_id = detail["accountBranchId"]
        print(f"Bank: {r_bank_detail.status_code}, Branch: {branch_id}")

        # Apply
        payload = {
            "accountBranchId": branch_id,
            "accountNumber": acc_num,
            "appliedKitta": 10,
            "bankId": bank_id,
            "boid": own_detail.get("boid"),
            "companyShareId": 770,
            "crnNumber": acc.crn,
            "customerId": own_detail.get("id"),
            "demat": own_detail.get("demat"),
            "transactionPIN": pin,
        }

        print("\nTesting HTTP/2 Apply to /applicantForm/:")
        r_apply = client.post(f"{BASE_URL}/applicantForm/", json=payload)
        print(f"Status: {r_apply.status_code}")
        print(f"Body: {r_apply.text[:200]}")
