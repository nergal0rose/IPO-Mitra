import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import asyncio
from playwright.async_api import async_playwright
import sqlite3
from crypto import decrypt

async def intercept_apply(dp_id, username, password, crn, pin):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async def handle_request(request):
            if "applicantForm" in request.url and request.method == "POST":
                print("\n" + "="*50)
                print(f"INTERCEPTED {request.method} {request.url}")
                print("="*50 + "\n")

        page.on("request", handle_request)

        try:
            print("Logging in...")
            await page.goto("https://meroshare.cdsc.com.np/")
            await page.wait_for_selector(".select2-selection", timeout=15000)
            await page.click(".select2-selection")
            await page.fill(".select2-search__field", str(dp_id))
            await asyncio.sleep(1)
            first_result = page.locator(".select2-results__option--highlighted")
            if await first_result.count() > 0:
                await first_result.click()
            else:
                await page.keyboard.press("Enter")
            
            await page.fill("input[name='username']", username)
            await page.fill("input[name='password']", password)
            await page.click("button[type='submit']")
            
            print("Going to My ASBA...")
            await asyncio.sleep(5)
            await page.goto("https://meroshare.cdsc.com.np/#/asba")
            await page.wait_for_selector(".company-list", timeout=30000)
            
            apply_btns = page.locator("button.btn-issue:has-text('Apply')")
            if await apply_btns.count() > 0:
                await apply_btns.first.click()
            else:
                print("No Apply buttons found! Exiting.")
                return
            
            await page.select_option("select[name='bank']", index=1)
            await page.fill("input[name='appliedKitta']", "10")
            await page.fill("input[name='crnNumber']", crn)
            
            await page.check("input#disclaimer")
            await page.click("button:has-text('Proceed')")
            
            await asyncio.sleep(2)
            await page.fill("input[name='transactionPin']", pin)
            
            print("Submitting...")
            await page.click("button:has-text('Apply')")
            
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    PIN = input("PIN: ").strip()
    conn = sqlite3.connect("meroshare.db")
    # Manoj is id=4
    row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=4").fetchone()
    dp_id, username, enc_pw, crn, enc_pin = row
    pw = decrypt(PIN, enc_pw)
    pin = decrypt(PIN, enc_pin)
    
    asyncio.run(intercept_apply(dp_id, username, pw, crn, pin))
