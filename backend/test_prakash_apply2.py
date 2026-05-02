import sys, os, json, requests
sys.path.insert(0, os.path.dirname(__file__))
from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL, HEADERS_BASE
import sqlite3

PIN = input("PIN: ").strip()
conn = sqlite3.connect("meroshare.db")
row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin, default_kitta FROM accounts WHERE id=2").fetchone()
dp_id, username, enc_pw, crn, enc_pin, kitta = row
pw = decrypt(PIN, enc_pw)
pin = decrypt(PIN, enc_pin)

ms = MeroShareAPI(dp_id, username, pw, crn, pin)
ms.login()
ms.get_bank_detail()
ms.get_own_detail()

payload = {
    "accountBranchId": ms.account_branch_id,
    "accountNumber": ms.bank_account_number,
    "accountTypeId": ms.account_type_id,
    "appliedKitta": str(kitta),
    "bankId": ms.bank_id,
    "boid": ms.own_detail.get("boid"),
    "companyShareId": 778, # Yambaling
    "crnNumber": crn,
    "customerId": ms.own_detail.get("id"),
    "demat": ms.own_detail.get("demat"),
    "transactionPIN": pin,
}

headers = {**HEADERS_BASE, "Authorization": ms.token}
r2 = requests.post(f"{BASE_URL}/applicantForm/share/apply", json=payload, headers=headers, timeout=15)
print(f"Status: {r2.status_code}")
print(r2.text[:500])
