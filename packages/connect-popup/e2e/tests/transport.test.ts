import { test, expect, firefox, chromium, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { waitAndClick, log } from '../support/helpers';

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
        log('start', test.info().title);

        log('launching browser');
        const browserInstance = await f.browser.launch();
        const context = await browserInstance.newContext();
        const page = await context.newPage();

        log(`going to: ${url}${f.queryString}#/method/verifyMessage`);
        await page.goto(`${url}${f.queryString}#/method/verifyMessage`);
        log('waiting for explorer to load');
        await page.waitForSelector("button[data-test='@submit-button']", {
            state: 'visible',
        });

        await page.locator("button[data-test='@submit-button']");

        log('opening popup');
        [popup] = await Promise.all([
            context.waitForEvent('page'),
            page.locator("button[data-test='@submit-button']").click({ timeout: 30000 }),
        ]);
        log('waiting for analytics');
        await waitAndClick(popup, ['@analytics/continue-button']);
        log('testing expect');
        await f.expect();
        await browserInstance.close();
    });
});
