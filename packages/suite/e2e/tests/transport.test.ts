import { test, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const url = process.env.URL || 'http://localhost:8000/';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

const passThroughInitialRun = async (page: Page) => {
    await page.click("button[data-test='@analytics/continue-button']");
    await page.click("button[data-test='@onboarding/exit-app-button']");
};

test.describe('Multiple applications using single device', () => {
    test('abc', async ({ browser }, {}) => {
        await TrezorUserEnvLink.api.stopBridge();
        await TrezorUserEnvLink.api.stopEmu();
        await TrezorUserEnvLink.api.startEmu({
            wipe: true,
        });
        await TrezorUserEnvLink.api.setupEmu({
            mnemonic: 'all all all all all all all all all all all all',
            passphrase_protection: true,
        });
        await TrezorUserEnvLink.api.startBridge();

        const context = await browser.newContext();

        const page1 = await context.newPage();
        const page2 = await context.newPage();

        // go to page 1, it acquires device and does not release it. passphrase prompt appears
        await page1.goto(`${url}`);
        await passThroughInitialRun(page1);
        await page1.waitForSelector("[data-test='@passphrase-type/standard']");

        // go to page 2, it sees that device is acquired somewhere else. Acquiring it notifies page1
        await page2.goto(`${url}`);
        await page2.waitForSelector("[data-test='@device-acquire']");

        // acquire in page 2. steals session from page 1
        await page2.click("[data-test='@device-acquire']");

        await Promise.all([
            page2.waitForSelector("[data-test='@passphrase-type/standard']"),
            page1.waitForSelector("[data-test='@deviceStatus/needsRefresh']"),
        ]);
        await page2.click("[data-test='@passphrase-type/standard']");
        await page2.waitForSelector("[data-test='@dashboard/graph']");

        // page1 finishes authorization of device
        // TODO: possible bug in suite, @deviceStatus/needsRefresh should do the same like the following line does
        await page1.click("[data-test='@exception/auth-failed/primary-button']");
        await page1.click("[data-test='@passphrase-type/standard']");
        await page1.waitForSelector("[data-test='@dashboard/graph']");

        // TODO: possible BUG/race condition in transport. Suite does not subscribe to /listen in time and does not see
        // the change. wait should not be here imho
        await page1.waitForTimeout(501);

        // when there is no unreleased session, pages can take session and releases them one after another
        await page2.click("[data-test='@deviceStatus/needsRefresh']");
        await page1.click("[data-test='@deviceStatus/needsRefresh']");
        await page2.click("[data-test='@deviceStatus/needsRefresh']");
    });
});
