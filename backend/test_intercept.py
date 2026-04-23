import asyncio
import sys, json
sys.path.append('backend')
from database import get_session; from models import Account; from crypto import decrypt
from playwright.async_api import async_playwright

async def intercept_portfolio():
    session = next(get_session())
    acc = session.query(Account).filter(Account.active == True).first()
    if not acc: print("No acc"); return
    
    x_app_pin = '1234'
    pw = decrypt(x_app_pin, acc.password)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
        page = await context.new_page()

        urls = []
        page.on("request", lambda req: urls.append((req.method, req.url)) if "portfolio" in req.url.lower() else None)

        await page.goto("https://meroshare.cdsc.com.np/", wait_until="networkidle")
        await page.wait_for_selector(".select2-selection")
        
        await page.click(".select2-selection")
        await page.type(".select2-search__field", str(acc.dp_id))
        await page.keyboard.press("Enter")
        
        await page.fill("input[name='username']", acc.username)
        await page.fill("input[name='password']", pw)
        await page.click("button[type='submit']")
        
        try:
            await page.wait_for_url("**/dashboard", timeout=30000)
            await page.goto("https://meroshare.cdsc.com.np/#/portfolio", wait_until="networkidle")
            await asyncio.sleep(8)
            for m, u in urls:
                print("FOUND:", m, u)
        except Exception as e:
            print("Error:", e)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(intercept_portfolio())
