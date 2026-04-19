import asyncio
from playwright.async_api import async_playwright
import json
import sys

async def get_meroshare_cookies(dp_id, username, password):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            await page.goto("https://meroshare.cdsc.com.np/")
            
            # Wait for the select2 container
            await page.wait_for_selector(".select2-selection", timeout=10000)
            await page.click(".select2-selection")
            
            # Wait for search field to appear
            await page.wait_for_selector(".select2-search__field", timeout=5000)
            await page.fill(".select2-search__field", str(dp_id))
            
            # Wait for results and CLICK the first one
            await asyncio.sleep(1) # Wait for results to filter
            first_result = page.locator(".select2-results__option--highlighted")
            if await first_result.count() > 0:
                await first_result.click()
            else:
                await page.keyboard.press("Enter")
            
            # Form fields
            await page.fill("input[name='username']", username)
            await page.fill("input[name='password']", password)
            
            # Listen for the Authorization header in any response
            token_container = {"token": None}
            async def handle_response(response):
                auth = await response.header_value("authorization")
                if auth:
                    token_container["token"] = auth
            
            page.on("response", handle_response)
            
            await page.click("button[type='submit']")
            
            # Wait for either dashboard or a successful token capture
            try:
                await page.wait_for_url("**/dashboard", timeout=20000)
            except:
                if not token_container["token"]:
                    # Take a screenshot to debug
                    await page.screenshot(path="login_debug.png")
                    print(f"DEBUG: Current URL: {page.url}")
                    raise Exception("Login failed or timed out. Screenshot saved.")
            
            # Now we have the cookies and the token
            cookies = await context.cookies()
            token = token_container["token"] or await page.evaluate("localStorage.getItem('Authorization')")
            
            if not token:
                # Try getting from response headers if not in localStorage
                pass
                
            return {
                "success": True,
                "cookies": {c['name']: c['value'] for c in cookies},
                "token": token
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            await browser.close()

if __name__ == "__main__":
    args = json.loads(sys.argv[1])
    res = asyncio.run(get_meroshare_cookies(**args))
    print(json.dumps(res))
