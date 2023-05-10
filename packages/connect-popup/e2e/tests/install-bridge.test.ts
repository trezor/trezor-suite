import { test, expect, firefox, chromium, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const url = process.env.URL || 'http://localhost:8088/';

let popup: Page;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
});

[firefox, chromium].forEach(browser => {
    test(`${browser.name()}: if bridge is not running, connect popup renders "install bridge" screen`, async () => {
        const browserInstance = await browser.launch();
        const page = await browserInstance.newPage();
        await page.goto(`${url}#/method/verifyMessage`);

        [popup] = await Promise.all([
            page.waitForEvent('popup'),
            page.click("button[data-test='@submit-button']"),
        ]);

        await expect(popup.getByRole('heading', { name: 'Install Bridge' })).toBeVisible();
        await browserInstance.close();
    });
});
