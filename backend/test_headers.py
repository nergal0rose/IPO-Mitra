import requests
from sqlmodel import Session, select
from database import engine
from models import Account
from crypto import decrypt
from meroshare_api import MeroShareAPI, BASE_URL

with Session(engine) as session:
    acc = session.exec(select(Account)).first()
    pw = decrypt('1234', acc.password)
    pin = decrypt('1234', acc.transaction_pin)
    api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
    api.login()
    
    api.get_bank_detail()
    api.get_own_detail()

    payload = {
        'demat': api.own_detail.get('demat') if api.own_detail else None,
        'boid': api.own_detail.get('boid') if api.own_detail else None,
        'accountNumber': api.bank_account_number,
        'customerId': api.own_detail.get('id') if api.own_detail else None,
        'accountBranchId': api.account_branch_id,
        'bankId': api.bank_id,
        'companyShareId': 770,
        'appliedKitta': "10",
        'crnNumber': api.crn,
        'transactionPIN': pin,
    }

    headers = api._headers()
    headers.update({
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Origin': 'https://meroshare.cdsc.com.np',
        'Referer': 'https://meroshare.cdsc.com.np/',
    })

    r = requests.post(f'{BASE_URL}/applicantForm/share/issue/apply', json=payload, headers=headers, timeout=10) # testing variant
    print(f"Status /share/issue/apply: {r.status_code}")
    print(r.text[:200])

    r2 = requests.post(f'{BASE_URL}/applicantForm/', json=payload, headers=headers, timeout=10)
    print(f"Status /applicantForm/: {r2.status_code}")
    print(r2.text[:200])
