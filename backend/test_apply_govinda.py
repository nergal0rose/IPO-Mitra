"""
Test: Apply for Yambaling using Govinda (account id=3)
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))

from crypto import decrypt
from meroshare_api import MeroShareAPI
import sqlite3

PIN = input("PIN: ").strip()

conn = sqlite3.connect("meroshare.db")
row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin, default_kitta FROM accounts WHERE id=3").fetchone()
dp_id, username, enc_pw, crn, enc_pin, kitta = row
pw = decrypt(PIN, enc_pw)
pin = decrypt(PIN, enc_pin)

print(f"Govinda: dp={dp_id}, user={username}, crn={crn}, kitta={kitta}")

ms = MeroShareAPI(dp_id, username, pw, crn, pin)
ok, err = ms.login()
if not ok:
    print(f"Login failed: {err}"); sys.exit(1)
print("Login OK")

applicable = ms.get_applicable_ipos()
print(f"Applicable IPOs: {len(applicable)}")
for ipo in applicable:
    print(f"  - {ipo.get('companyName')} (id={ipo.get('companyShareId')})")

yambaling = None
for ipo in applicable:
    if "yambaling" in (ipo.get("companyName") or "").lower():
        yambaling = ipo
        break

if not yambaling:
    print("Yambaling not found!"); sys.exit(1)

print(f"\nApplying {kitta} units for {yambaling.get('companyName')}...")
result = ms.apply_ipo(yambaling, kitta, dry_run=False)
print(f"\nRESULT: {json.dumps(result, indent=2)}")
