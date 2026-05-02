import sys, os, json, requests
sys.path.insert(0, os.path.dirname(__file__))
from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL
import sqlite3

PIN = input("PIN: ").strip()
conn = sqlite3.connect("meroshare.db")

def check_banks(acc_id, name):
    row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=?", (acc_id,)).fetchone()
    dp_id, username, enc_pw, crn, enc_pin = row
    ms = MeroShareAPI(dp_id, username, decrypt(PIN, enc_pw), crn, decrypt(PIN, enc_pin))
    ms.login()
    r = requests.get(f"{BASE_URL}/bank/", headers=ms._headers())
    print(f"\n--- {name} RAW /bank/ RESPONSE ---")
    print(json.dumps(r.json(), indent=2))

check_banks(3, "Govinda")
check_banks(2, "Prakash")
