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
    print(f"Login failed: {err}"); sys.exit(1)
print("Login OK")

# Fetch applied IPOs
url = f"{BASE_URL}/applicantForm/active/search/"
payload = {
    "filterFieldParams": [],
    "page": 1, "size": 50,
    "searchRoleViewConstants": "VIEW_APPLICANT_FORM_COMPLETE",
    "filterDateParams": []
}
r = requests.post(url, json=payload, headers={**HEADERS_BASE, "Authorization": ms.token}, timeout=15)
if r.status_code == 200:
    data = r.json()
    items = data.get("content", data.get("object", []))
    print(f"Found {len(items)} active applications.")
    for item in items:
        cs = item.get("companyShare", {})
        print(f" - {cs.get('companyName')} (ID: {cs.get('id')})")
        if cs.get("id") == 778 or "Yambaling" in str(cs):
            print("\nFound Yambaling Application:")
            print(json.dumps(item, indent=2))
else:
    print(f"Error fetching active applications: {r.status_code}")
    print(r.text)
