import { test, expect, Page, devices } from '@playwright/test';
import { ensureDirectoryExists } from '@trezor/node-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const url = process.env.URL || 'http://localhost:8088/';

let dir: string;
let popup: Page;

const iPhone = devices['iPhone 13 Pro'];
const android = devices['Pixel 5'];
const safari = devices['Desktop Safari'];
test.beforeAll(async () => {
    dir = await ensureDirectoryExists('./e2e/screenshots/unsupported-browser');
});

const openPopup = async (page: Page) =>
    (
        await Promise.all([
            // It is important to call waitForEvent before click to set up waiting.
            page.waitForEvent('popup'),
            // Opens popup.
            page.click("button[data-test='@submit-button']"),
        ])
    )[0];

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
});

test('unsupported browser', async ({ browser }) => {
    const context = await browser.newContext({
        ...safari,
    });
    const page = await context.newPage();
    await page.goto(`${url}#/method/getPublicKey`);
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
    popup = await openPopup(page);
    await popup.waitForSelector('text=Unsupported browser');
    await popup.screenshot({ path: `${dir}/browser-not-supported.png` });
    await popup.close();
    await page.close();
    await context.close();
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
    await popup.waitForSelector('text=Pair devices');
    await popup.close();
    await page.close();
    await context.close();
});

// test mobile browsers
test.describe(() => {
    const fixtures = [
        { desc: 'iPhone', device: iPhone },
        { desc: 'android', device: android },
    ];
    for (const f of fixtures) {
        test(`env: web, device: mobile/${f.desc} => not allowed `, async ({ browser }) => {
            const context = await browser.newContext({
                ...f.device,
            });
            const page = await context.newPage();
            await page.goto(`${url}#/method/getPublicKey`);

            popup = await openPopup(page);
            // unfortunately webusb now does not work for connect-popup, so mobile chrome won't run even if it technically could
            await popup.waitForSelector('text=Smartphones not supported yet');
            await popup.screenshot({ path: `${dir}/mobile-${f.desc}-not-supported.png` });

            await popup.click('text=Close');
            await page.close();
            await context.close();
        });
    }
});
