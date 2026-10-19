const puppeteer = require('puppeteer');
const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto('http://localhost:3000/index.html');

        console.log("Navigated to game.");
        await page.waitForSelector('.menu-box button');

        console.log("Clicking Manager...");
        const buttons = await page.$$('.menu-box button');
        if (buttons.length > 0) {
            await buttons[0].click(); // New Dive
            await delay(500);

            const nextBtns = await page.$$('.menu-box button');
            if(nextBtns.length > 0) await nextBtns[0].click(); // Select manager
            await delay(500);

            const startBtns = await page.$$('.menu-box button');
            if(startBtns.length > 0) await startBtns[0].click(); // Go to match (dashboard)
        }

        await page.waitForSelector('.top-bar .team-info');
        console.log("In Dashboard.");

        console.log("Clicking Events...");
        const dashButtons = await page.$$('.menu-box button');
        for (let b of dashButtons) {
            const text = await b.evaluate(el => el.textContent);
            if (text.includes('イベント')) {
                await b.click();
                break;
            }
        }
        await delay(500);

        console.log("Returning to Dashboard from events...");
        const eventButtons = await page.$$('.menu-box button');
        await eventButtons[eventButtons.length - 1].click(); // 戻る button

        await delay(500);

        console.log("Starting match...");
        const startMatchBtns = await page.$$('.menu-box button');
        for (let b of startMatchBtns) {
            const text = await b.evaluate(el => el.textContent);
            if (text.includes('KICK OFF')) {
                await b.click();
                break;
            }
        }

        console.log("Wait for game canvas to render");
        await page.waitForSelector('canvas');

        console.log("Match started. Waiting briefly...");
        await delay(2000);

        console.log("Full game loop simulation passed without fatal crashes.");
        await browser.close();
    } catch (e) {
        console.error("Test failed: ", e);
        process.exit(1);
    }
})();
