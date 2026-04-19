import sys
import os
sys.path.insert(0, '.')
from database import engine
from models import Account
from sqlmodel import Session, select
from crypto import decrypt
import re

with Session(engine) as session:
    acc = session.exec(select(Account)).first()
    pw = decrypt('1234', acc.password)
    pin = decrypt('1234', acc.transaction_pin)
    
    source = os.path.join('..', 'meroshare.py')
    with open(source, 'r') as f:
        content = f.read()
    
    # Replace credentials for the first account
    content = content.replace('"dp_id": 199', f'"dp_id": {acc.dp_id}')
    content = content.replace('"username": "404161"', f'"username": "{acc.username}"')
    content = content.replace('"password": "Prakash7"', f'"password": "{pw}"')
    content = content.replace('"crn": "13201669721"', f'"crn": "{acc.crn}"')
    content = content.replace('"transaction_pin": "1905"', f'"transaction_pin": "{pin}"')
    
    with open('meroshare_test.py', 'w') as f:
        f.write(content)
print("Created meroshare_test.py")
