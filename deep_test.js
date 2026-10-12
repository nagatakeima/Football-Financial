const puppeteer = require('puppeteer');
const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();

        // Output console logs from the page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        await page.goto('http://localhost:3000');
        console.log("Navigated to game.");
        await page.waitForSelector('.menu-box button');

        // Select Manager
        const buttons = await page.$$('.menu-box button');
        if (buttons.length > 0) {
            await buttons[0].click();
        }
        await page.waitForSelector('.top-bar .team-info');
        console.log("In Dashboard. Starting 5 loops...");

        for (let loop = 1; loop <= 5; loop++) {
            console.log(`--- Loop ${loop} Start ---`);

            // Events
            let dashButtons = await page.$$('.menu-box button');
            for (let b of dashButtons) {
                const text = await b.evaluate(el => el.textContent);
                if (text.includes('イベント')) {
                    await b.click();
                    break;
                }
            }
            await delay(500);

            let eventButtons = await page.$$('.menu-box button');
            // Try to click a random event to consume AP/Funds if possible
            if(eventButtons.length > 1) {
                await eventButtons[0].click();
                await delay(500);
            }
            // back
            eventButtons = await page.$$('.menu-box button');
            await eventButtons[eventButtons.length - 1].click();
            await delay(500);

            // Match
            dashButtons = await page.$$('.menu-box button');
            for (let b of dashButtons) {
                const text = await b.evaluate(el => el.textContent);
                if (text.includes('試合開始')) {
                    await b.click();
                    break;
                }
            }
            await page.waitForSelector('canvas');
            console.log(`Match ${loop} started. Skpping match...`);

            // Skip match
            await delay(500);
            const skipBtns = await page.$$('text'); // Phaser text objects are rendered in canvas, need eval
            await page.evaluate(() => {
                // Find skip button in Phaser scene and click it
                const scene = window.game.scene.keys.MatchScene;
                if(scene && scene.isSkip !== undefined) {
                    scene.isSkip = true;
                    scene.tickMatch();
                }
            });

            // wait for match end UI
            await delay(1000);
            const closeBtns = await page.$$('.menu-box button');
            if (closeBtns.length > 0) {
                await closeBtns[0].click();
            }
            await delay(1000);
            console.log(`--- Loop ${loop} End ---`);
        }

        console.log("Deep test finished.");

    } catch (e) {
        console.error("Deep test failed: ", e);
    } finally {
        if(browser) await browser.close();
    }
})();
