"""
Test applying with different payload combinations (boid vs demat).
"""
import sys, os, json, requests
sys.path.insert(0, os.path.dirname(__file__))

from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL, HEADERS_BASE
import sqlite3

PIN = input("PIN: ").strip()

conn = sqlite3.connect("meroshare.db")
row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=1").fetchone()
dp_id, username, enc_pw, crn, enc_pin = row
pw = decrypt(PIN, enc_pw)
pin = decrypt(PIN, enc_pin)

ms = MeroShareAPI(dp_id, username, pw, crn, pin)
ok, err = ms.login()
if not ok:
    sys.exit(1)
ms.get_bank_detail()
ms.get_own_detail()

test_crn = "013201669721"  # the correct CRN provided by user
headers = {**HEADERS_BASE, "Authorization": ms.token}

# Try boid = full demat
payload_demat_boid = {
    "accountBranchId": ms.account_branch_id,
    "accountNumber": ms.bank_account_number,
    "accountTypeId": ms.account_type_id,
    "appliedKitta": "10",
    "bankId": ms.bank_id,
    "boid": ms.own_detail.get("demat"),  # FULL DEMAT
    "companyShareId": 778,
    "crnNumber": test_crn,
    "customerId": ms.own_detail.get("id"),
    "demat": ms.own_detail.get("demat"),
    "transactionPIN": pin,
}

r = requests.post(f"{BASE_URL}/applicantForm/share/apply", json=payload_demat_boid, headers=headers, timeout=15)
print(f"With BOID = Full Demat ({ms.own_detail.get('demat')}): {r.status_code}")
print(r.text)

# Try boid = boid (8 digits)
payload_8_boid = {**payload_demat_boid, "boid": ms.own_detail.get("boid")}
r2 = requests.post(f"{BASE_URL}/applicantForm/share/apply", json=payload_8_boid, headers=headers, timeout=15)
print(f"\nWith BOID = 8 digits ({ms.own_detail.get('boid')}): {r2.status_code}")
print(r2.text)

