import { test, expect, firefox, chromium, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const url = process.env.URL || 'http://localhost:8088/';

let popup: Page;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
});

const fixtures = [
    {
        browser: firefox,
        description: `bridge is the only available transport`,
        queryString: '',
        expect: () => expect(popup.getByRole('heading', { name: 'Install Bridge' })).toBeVisible(),
    },
    {
        browser: chromium,
        description: `iframe and host different origins: false -> bridge`,
        queryString: '?trezor-connect-src=https://connect.trezor.io/9/',
        expect: () => expect(popup.getByRole('heading', { name: 'Install Bridge' })).toBeVisible(),
    },
    {
        browser: chromium,
        description: `iframe and host same origins`,
        queryString: '',
        expect: () => popup.locator('text==Pair devices >> visible=true').isVisible(),
    },
];

fixtures.forEach(f => {
    test(`${f.browser.name()}: ${f.description}`, async () => {
        const browserInstance = await f.browser.launch();
        const page = await browserInstance.newPage();
        await page.goto(`${url}${f.queryString}#/method/verifyMessage`);

        [popup] = await Promise.all([
            page.waitForEvent('popup'),
            page.click("button[data-test-id='@submit-button']"),
        ]);

        await f.expect();
        await browserInstance.close();
    });
});
