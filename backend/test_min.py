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

    print("Testing with minimal payload (only companyShareId):")
    payload = {"companyShareId": 770}
    r = api.session.post(f"{BASE_URL}/applicantForm/", json=payload, headers=api._headers())
    print(f"Status: {r.status_code}, Body: {r.text[:100]}")
