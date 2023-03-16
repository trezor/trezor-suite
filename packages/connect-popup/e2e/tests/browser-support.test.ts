import { test, expect, Page } from '@playwright/test';

import { ensureScreenshotsDir } from '../support/ensureScreenshotsDir';

const url = process.env.URL || 'http://localhost:8088/';

let dir: string;
let popup: Page;

test.beforeAll(() => {
    dir = ensureScreenshotsDir('unsupported-browser');
});

test.afterEach(async () => {
    await popup.close();
});

const openPopup = async (page: Page) => {
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
    return (
        await Promise.all([
            // It is important to call waitForEvent before click to set up waiting.
            page.waitForEvent('popup'),
            // Opens popup.
            page.click("button[data-test='@submit-button']"),
        ])
    )[0];
};

test('unsupported-browser', async ({ browser }) => {
    const context = await browser.newContext({
        userAgent:
            'Mozilla/5.0 (Mobile; Windows Phone 8.1; Android 4.0; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 635) like iPhone OS 7_0_3 Mac OS X AppleWebKit/537 (KHTML, like Gecko) Mobile Safari/537',
    });
    const page = await context.newPage();
    await page.goto(`${url}#/method/getPublicKey`);
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
    popup = await openPopup(page);
    await popup.waitForSelector('text=Unsupported browser');
    await popup.screenshot({ path: `${dir}/unsupported-browser.png` });
});

test('outdated-browser', async ({ browser }) => {
    const context = await browser.newContext({
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:100.0) Gecko/20100101 Firefox/50.0',
    });
    const page = await context.newPage();
    await page.goto(`${url}#/method/getPublicKey`);
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
    popup = await openPopup(page);
    await popup.waitForLoadState('load');
    await popup.waitForSelector('text=Outdated browser');
    // no react is rendering yet only browser check
    expect(await popup.locator('#reactRenderIn').count()).toEqual(0);
    await popup.screenshot({ path: `${dir}/outdated-browser-1.png` });
    await popup.click('text=I acknowledge and wish to continue');
    // only after this check react renders
    await popup.waitForSelector('#reactRenderIn');
    await popup.screenshot({ path: `${dir}/outdated-browser-2.png` });
});
