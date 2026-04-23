const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    let portfolioUrl = "";

    page.on('request', request => {
        const url = request.url();
        if (url.includes('myPortfolio')) {
            console.log("INTERCEPTED myPortfolio URL:", url, "METHOD:", request.method());
            portfolioUrl = url;
        }
    });

    await page.goto('https://meroshare.cdsc.com.np/#/login');
    
    // Fill login
    // wait for networkidle
    await page.waitForTimeout(2000);
    // Find options
    const dpOptions = await page.$$('select[name="selectBranch"] option');
    await page.select('select[name="selectBranch"]', '130'); // Global IME

    await page.type('#username', 'testxyz123'); // Dummy, just to see if it makes request! Wait, it won't proceed without valid credentials.
    
    await browser.close();
})();
