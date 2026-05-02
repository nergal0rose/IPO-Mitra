import asyncio
import json
import sys
from playwright.async_api import async_playwright
import sqlite3
from crypto import decrypt
import os

sys.path.insert(0, os.path.dirname(__file__))
from meroshare_api import MeroShareAPI, BASE_URL

async def test_fetch(dp_id, username, password, crn, pin):
    ms = MeroShareAPI(dp_id, username, password, crn, pin)
    ms.login()
    ms.get_bank_detail()
    ms.get_own_detail()
    
    payload = {
        "accountBranchId": ms.account_branch_id,
        "accountNumber": ms.bank_account_number,
        "accountTypeId": ms.account_type_id,
        "appliedKitta": "10",
        "bankId": ms.bank_id,
        "boid": ms.own_detail.get("boid"),
        "companyShareId": 768, # Buddhabhumi
        "crnNumber": crn,
        "customerId": ms.own_detail.get("id"),
        "demat": ms.own_detail.get("demat"),
        "transactionPIN": pin,
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Executing fetch...")
        await page.goto("https://meroshare.cdsc.com.np/")
        token = ms.token
        
        print("Executing fetch...")
        js_code = f"""
        async () => {{
            const res = await fetch("https://webbackend.cdsc.com.np/api/meroShare/applicantForm/", {{
                method: "POST",
                headers: {{
                    "Content-Type": "application/json",
                    "Authorization": "{token}"
                }},
                body: JSON.stringify({json.dumps(payload)})
            }});
            const text = await res.text();
            return {{ status: res.status, text: text }};
        }}
        """
        result = await page.evaluate(js_code)
        print(f"Result: {result['status']}")
        print(result['text'])
        
        await browser.close()

if __name__ == "__main__":
    PIN = input("PIN: ").strip()
    conn = sqlite3.connect("meroshare.db")
    row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=3").fetchone()
    dp_id, username, enc_pw, crn, enc_pin = row
    asyncio.run(test_fetch(dp_id, username, decrypt(PIN, enc_pw), crn, decrypt(PIN, enc_pin)))
