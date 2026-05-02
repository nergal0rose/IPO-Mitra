import asyncio
import json
import os
from playwright.async_api import async_playwright

async def manual_intercept():
    print("Opening browser... Please log in as Prakash and apply manually!")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        async def handle_request(request):
            if "cdsc.com.np" in request.url and "api/meroShare/applicantForm" in request.url and request.method == "POST":
                print("\n================ INTERCEPTED SUCCESS ================")
                print(f"URL: {request.url}")
                try:
                    if request.post_data:
                        print(f"PAYLOAD: {json.dumps(json.loads(request.post_data), indent=2)}")
                except:
                    print(f"RAW PAYLOAD: {request.post_data}")
                print("=====================================================\n")

        page.on("request", handle_request)
        
        await page.goto("https://meroshare.cdsc.com.np/#/login")
        
        # Keep the browser open so the user can manually apply
        print("Browser is open. Waiting for you to apply...")
        
        # Wait until an application is made, or user closes the browser
        try:
            await page.wait_for_event("close", timeout=600000) # Wait up to 10 minutes
        except Exception:
            pass

if __name__ == "__main__":
    asyncio.run(manual_intercept())
