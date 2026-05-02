import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from crypto import decrypt
from meroshare_api import MeroShareAPI
import sqlite3

PIN = input("PIN: ").strip()
conn = sqlite3.connect("meroshare.db")
row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=4").fetchone()
dp_id, username, enc_pw, crn, enc_pin = row
ms = MeroShareAPI(dp_id, username, decrypt(PIN, enc_pw), crn, decrypt(PIN, enc_pin))
ok, err = ms.login()
print(f"Manoj Login: {ok}, {err}")
