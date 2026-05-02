"""
Deep debug: hit the raw MeroShare endpoints to understand what /applicantForm/ actually returns
vs what we need for open IPOs.
"""
import sys, os, json, requests
sys.path.insert(0, os.path.dirname(__file__))

from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL, HEADERS_BASE
import sqlite3

PIN = input("Enter PIN: ").strip()

conn = sqlite3.connect("meroshare.db")
row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=1").fetchone()
dp_id, username, enc_pw, crn, enc_pin = row
pw = decrypt(PIN, enc_pw)
pin = decrypt(PIN, enc_pin)

# Login
ms = MeroShareAPI(dp_id, username, pw, crn, pin)
ok, err = ms.login()
if not ok:
    print(f"Login failed: {err}")
    sys.exit(1)
print(f"Login OK. Token prefix: {ms.token[:30]}...")

headers = {**HEADERS_BASE, "Authorization": ms.token}

# --- Try different endpoints ---
endpoints = [
    ("GET", f"{BASE_URL}/applicantForm/"),
    ("GET", f"{BASE_URL}/active/"),
    ("GET", f"{BASE_URL}/companyShare/currentIssue/"),
    ("GET", f"{BASE_URL}/companyShare/applicableIssue/"),
    ("POST", f"{BASE_URL}/companyShare/currentIssue/", {
        "filterFieldParams": [],
        "page": 1, "size": 50,
        "searchRoleViewConstants": "VIEW_APPLICABLE_SHARE",
        "filterDateParams": []
    }),
    ("POST", f"{BASE_URL}/companyShare/applicableIssue/", {
        "filterFieldParams": [],
        "page": 1, "size": 50,
        "searchRoleViewConstants": "VIEW_APPLICABLE_SHARE",
        "filterDateParams": []
    }),
]

for method, url, *body in endpoints:
    print(f"\n{'='*60}")
    print(f"{method} {url}")
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=15)
        else:
            r = requests.post(url, json=body[0] if body else {}, headers=headers, timeout=15)
        print(f"Status: {r.status_code}")
        text = r.text[:2000]
        # Try to pretty print JSON
        try:
            data = json.loads(text)
            if isinstance(data, list):
                print(f"Response is list with {len(data)} items")
                for i, item in enumerate(data[:3]):
                    print(f"  [{i}]: {json.dumps(item, indent=2)[:300]}")
            elif isinstance(data, dict):
                print(f"Response keys: {list(data.keys())}")
                if "object" in data:
                    obj = data["object"]
                    if isinstance(obj, list):
                        print(f"  object has {len(obj)} items")
                        for i, item in enumerate(obj[:3]):
                            print(f"  [{i}]: {json.dumps(item, indent=2)[:300]}")
                if "content" in data:
                    content = data["content"]
                    if isinstance(content, list):
                        print(f"  content has {len(content)} items")
                        for i, item in enumerate(content[:3]):
                            print(f"  [{i}]: {json.dumps(item, indent=2)[:300]}")
                else:
                    print(json.dumps(data, indent=2)[:500])
        except:
            print(f"Raw: {text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
