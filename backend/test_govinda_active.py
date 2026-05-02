import sys, os, json, requests
sys.path.insert(0, os.path.dirname(__file__))

from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL, HEADERS_BASE
import sqlite3

PIN = input("PIN: ").strip()

conn = sqlite3.connect("meroshare.db")
row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=3").fetchone()
dp_id, username, enc_pw, crn, enc_pin = row
pw = decrypt(PIN, enc_pw)
pin = decrypt(PIN, enc_pin)

ms = MeroShareAPI(dp_id, username, pw, crn, pin)
ok, err = ms.login()
if not ok:
    print(f"Login failed: {err}"); sys.exit(1)

report_url = f"{BASE_URL}/applicantForm/report/detail/264674317"
r = requests.get(report_url, headers={**HEADERS_BASE, "Authorization": ms.token})
print(json.dumps(r.json(), indent=2))
