"""
Loop through all accounts, open a browser for each, log in, navigate to ASBA apply,
and collect all bank IDs from the API response.
"""
import asyncio, json, sqlite3, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.async_api import async_playwright
from crypto import decrypt

async def collect_banks_for_account(p, dp_id, username, password, banks_dict):
    print(f"\n--- Logging in as {username} @ DP {dp_id} ---")
    browser = await p.chromium.launch(headless=True)
    ctx = await browser.new_context()
    page = await ctx.new_page()

    async def on_response(response):
        if "api/meroShare/bank" in response.url and "/bank/" not in response.url.split("api/meroShare/bank")[1][:2]:
            if response.status == 200:
                try:
                    data = await response.json()
                    if isinstance(data, list):
                        for b in data:
                            if "id" in b and "name" in b:
                                if b["id"] not in banks_dict:
                                    banks_dict[b["id"]] = b["name"]
                                    print(f"  NEW bank: id={b['id']}, name={b['name']}")
                except:
                    pass

    page.on("response", on_response)

    try:
        await page.goto("https://meroshare.cdsc.com.np/#/login", timeout=20000)
        await page.wait_for_selector(".select2-selection", timeout=10000)
        await page.click(".select2-selection")
        await page.wait_for_selector(".select2-search__field", timeout=5000)
        await page.fill(".select2-search__field", str(dp_id))
        await asyncio.sleep(1)
        await page.keyboard.press("Enter")
        await page.fill("input[name='username']", str(username))
        await page.fill("input[name='password']", password)
        await page.click("button[type='submit']")
        await page.wait_for_url("**/dashboard", timeout=15000)
        print(f"  Logged in. Navigating to ASBA...")
        await page.goto("https://meroshare.cdsc.com.np/#/asba")
        # wait for the page to load and make bank API calls
        await asyncio.sleep(5)
        # try clicking Apply on first available IPO
        apply_btns = page.locator("button.btn-issue")
        if await apply_btns.count() > 0:
            await apply_btns.first.click()
            await asyncio.sleep(3)
    except Exception as e:
        print(f"  Error: {e}")
    finally:
        await browser.close()

async def main():
    PIN = input("PIN: ").strip()
    accounts = sqlite3.connect("meroshare.db").execute(
        "SELECT dp_id, username, password, crn, transaction_pin FROM accounts"
    ).fetchall()

    banks_dict = {}  # id -> name

    async with async_playwright() as p:
        for r in accounts:
            dp_id, username, enc_pw = r[0], r[1], r[2]
            try:
                pw = decrypt(PIN, enc_pw)
                await collect_banks_for_account(p, dp_id, username, pw, banks_dict)
            except Exception as e:
                print(f"  Decrypt/skip error: {e}")

    print(f"\n{'='*60}")
    print(f"TOTAL VERIFIED BANK IDs: {len(banks_dict)}")
    print(f"{'='*60}")
    for bid, bname in sorted(banks_dict.items()):
        print(f'        {{"id": {bid}, "name": "{bname}"}},')

asyncio.run(main())
