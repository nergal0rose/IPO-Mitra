import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from crypto import decrypt
from meroshare_api import MeroShareAPI
import sqlite3

PIN = input("PIN: ").strip()
conn = sqlite3.connect("meroshare.db")
row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=2").fetchone()
dp_id, username, enc_pw, crn, enc_pin = row
ms = MeroShareAPI(dp_id, username, decrypt(PIN, enc_pw), crn, decrypt(PIN, enc_pin))
ms.login()
ipos = ms.get_applicable_ipos()
print("Open IPOs:")
for ipo in ipos:
    print(f"- {ipo.get('companyName')} (ID: {ipo.get('companyShareId')})")
    print(f"Applying for {ipo.get('companyName')}...")
    res = ms.apply_ipo(ipo, 10, dry_run=False)
    print(f"Result: {res}")
