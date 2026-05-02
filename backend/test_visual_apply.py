import asyncio
import json
import sys
from playwright.async_api import async_playwright
import sqlite3
import os

sys.path.insert(0, os.path.dirname(__file__))
from crypto import decrypt

async def apply_visually(dp_id, username, password, crn, pin):
    print("Starting browser...")
    async with async_playwright() as p:
        # headless=False so the user can watch the magic
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        intercepted_payload = None
        intercepted_url = None

        async def handle_request(request):
            nonlocal intercepted_payload, intercepted_url
            if "cdsc.com.np" in request.url and "api/meroShare/applicantForm" in request.url and request.method == "POST":
                intercepted_url = request.url
                try:
                    if request.post_data:
                        intercepted_payload = json.loads(request.post_data)
                except:
                    pass

        page.on("request", handle_request)

        try:
            print(f"Logging in with DP {dp_id} and User {username}...")
            await page.goto("https://meroshare.cdsc.com.np/#/login")
            
            # Select DP
            await page.wait_for_selector(".select2-selection")
            await page.click(".select2-selection")
            await page.fill(".select2-search__field", str(dp_id))
            await asyncio.sleep(1)
            await page.keyboard.press("Enter")
            
            # Enter credentials
            await page.fill("input[name='username']", username)
            await page.fill("input[name='password']", password)
            await page.click("button[type='submit']")
            
            # Wait for login to succeed by checking URL or Dashboard element
            print("Waiting for login to succeed...")
            await page.wait_for_url("**/dashboard", timeout=15000)
            print("Login successful!")
            
            # Navigate to ASBA
            print("Navigating to My ASBA...")
            await page.goto("https://meroshare.cdsc.com.np/#/asba")
            await page.wait_for_selector(".company-list", timeout=15000)
            
            # Find an IPO to apply
            print("Finding 'Apply' button...")
            apply_btns = page.locator("button.btn-issue:has-text('Apply')")
            if await apply_btns.count() > 0:
                await apply_btns.first.click()
            else:
                print("No open IPOs found to apply for! Trying 'Edit' instead just to see form...")
                edit_btns = page.locator("button.btn-issue:has-text('Edit')")
                if await edit_btns.count() > 0:
                    await edit_btns.first.click()
                else:
                    print("No editable IPOs either. Exiting.")
                    return

            # Wait for form to load
            await page.wait_for_selector("select[name='bank']", timeout=15000)
            print("Form loaded. Selecting bank...")
            
            # Select the FIRST bank in the dropdown (index 1 because index 0 is "Select Bank")
            await page.select_option("select[name='bank']", index=1)
            await asyncio.sleep(1)
            
            print("Filling Kitta and CRN...")
            await page.fill("input[name='appliedKitta']", "10")
            await page.fill("input[name='crnNumber']", crn)
            
            print("Clicking Proceed...")
            await page.check("input#disclaimer")
            await page.click("button:has-text('Proceed')")
            
            print("Entering PIN...")
            await page.wait_for_selector("input[name='transactionPin']", timeout=10000)
            await page.fill("input[name='transactionPin']", pin)
            
            print("Submitting Final Application...")
            # We click apply and wait for network request
            await page.click("button.btn-primary:has-text('Apply')")
            
            print("Waiting for response...")
            await asyncio.sleep(5)
            
            if intercepted_payload:
                print("\n================ INTERCEPTED SUCCESS ================")
                print(f"URL: {intercepted_url}")
                print(f"PAYLOAD: {json.dumps(intercepted_payload, indent=2)}")
                print("=====================================================\n")
            else:
                print("Failed to intercept payload.")

        except Exception as e:
            print(f"Playwright automation failed: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    PIN = input("PIN: ").strip()
    conn = sqlite3.connect("meroshare.db")
    # Prakash is id=2
    row = conn.execute("SELECT dp_id, username, password, crn, transaction_pin FROM accounts WHERE id=2").fetchone()
    dp_id, username, enc_pw, crn, enc_pin = row
    
    pw = decrypt(PIN, enc_pw)
    pin_raw = decrypt(PIN, enc_pin)
    
    asyncio.run(apply_visually(dp_id, username, pw, crn, pin_raw))
