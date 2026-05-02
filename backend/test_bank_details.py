import sys, os, requests, sqlite3
sys.path.insert(0, os.path.dirname(__file__))
from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL

conn = sqlite3.connect('meroshare.db')
r = conn.execute('SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=3').fetchone()
ms = MeroShareAPI(r[0], r[1], decrypt('1234', r[2]), r[3], decrypt('1234', r[4]))
ms.login()
print(requests.get(f'{BASE_URL}/bank/30/', headers=ms._headers()).text)
