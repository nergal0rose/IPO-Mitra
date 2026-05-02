import asyncio
import sys
import json
from playwright.async_api import async_playwright

async def apply_ipo_browser(dp_id, username, password, crn, pin, share_id, kitta, company_name):
    async with async_playwright() as p:
        # Using a realistic user agent
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            # 1. Login
            await page.goto("https://meroshare.cdsc.com.np/", wait_until="networkidle", timeout=60000)
            await page.wait_for_selector(".select2-selection", timeout=30000)
            
            # Click DP dropdown
            await page.click(".select2-selection")
            await page.type(".select2-search__field", str(dp_id))
            await page.keyboard.press("Enter")
            
            # Form fields
            await page.fill("input[name='username']", username)
            await page.fill("input[name='password']", password)
            await page.click("button[type='submit']")
            
            # Wait for dashboard (More robust wait)
            try:
                await page.wait_for_url("**/dashboard", timeout=60000)
            except Exception as e:
                await page.screenshot(path="error_last_apply.png")
                return {"status": "FAILED", "message": f"Login Timeout. Screenshot saved. Check if credentials are correct or site is slow."}
            
            # 2. Navigate to ASBA
            await page.goto("https://meroshare.cdsc.com.np/#/asba")
            await page.wait_for_selector(".nav-tabs")
            
            # Click 'Apply for Issue' tab
            await page.click("li:has-text('Apply for Issue')")
            
            # 3. Find the IPO and Apply
            # The IPOs are listed in a table. We look for company_name and click 'Apply'
            apply_btn_selector = f"tr:has-text('{company_name}') button:has-text('Apply')"
            # Support for 'Re-Apply' too
            reapply_btn_selector = f"tr:has-text('{company_name}') button:has-text('Edit'), tr:has-text('{company_name}') button:has-text('Re-Apply')"
            
            target_btn = None
            try:
                await page.wait_for_selector(apply_btn_selector, timeout=5000)
                target_btn = apply_btn_selector
            except:
                try:
                    await page.wait_for_selector(reapply_btn_selector, timeout=5000)
                    target_btn = reapply_btn_selector
                except:
                    pass
            
            if not target_btn:
                return {"status": "FAILED", "message": f"Could not find Apply button for {company_name}"}
                
            await page.click(target_btn)
            
            # 4. Fill Application Form
            await page.wait_for_selector("select[name='bank']", timeout=15000)
            
            # Select first bank branch (usually only one)
            await page.select_option("select[name='bank']", index=1)
            
            # Applied Kitta
            await page.fill("input[name='appliedKitta']", str(kitta))
            
            # CRN
            await page.fill("input[name='crnNumber']", crn)
            
            # Check terms
            await page.check("input[name='termsOfService']")
            
            # Proceed
            await page.click("button:has-text('Proceed')")
            
            # 5. Transaction PIN
            await page.wait_for_selector("input[name='transactionPin']", timeout=15000)
            await page.fill("input[name='transactionPin']", pin)
            
            # Apply
            await page.click("button:has-text('Apply')")
            
            # 6. Wait for success/fail message
            # MeroShare shows a toast message
            toast = await page.wait_for_selector(".toast-message", timeout=10000)
            msg = await toast.inner_text()
            
            if "successfully" in msg.lower():
                return {"status": "SUCCESS", "message": msg}
            else:
                return {"status": "FAILED", "message": msg}
                
        except Exception as e:
            return {"status": "FAILED", "message": f"Browser Error: {str(e)}"}
        finally:
            await browser.close()

if __name__ == "__main__":
    # For testing from CLI: python browser_apply.py <json_args>
    args = json.loads(sys.argv[1])
    result = asyncio.run(apply_ipo_browser(**args))
    print(json.dumps(result))
