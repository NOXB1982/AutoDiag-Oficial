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

        console.log("Navigating to http://localhost:3000/");
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
        
        console.log("Waiting 3 seconds...");
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
        console.log("Done.");
    } catch (e) {
        console.error("Puppeteer Script Error:", e);
    }
})();
