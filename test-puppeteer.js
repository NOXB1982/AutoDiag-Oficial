const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('BROWSER CONSOLE ERROR:', msg.text());
            }
        });
        
        page.on('pageerror', error => {
            console.log('PAGE UNHANDLED ERROR:', error.message);
        });

        page.on('requestfailed', request => {
            console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
        });

        console.log("Navigating to https://www.autodiagai.pt/");
        await page.goto('https://www.autodiagai.pt/', { waitUntil: 'networkidle0' });
        
        console.log("Waiting 3 seconds just in case...");
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
        console.log("Done.");
    } catch (e) {
        console.error("Puppeteer Script Error:", e);
    }
})();
