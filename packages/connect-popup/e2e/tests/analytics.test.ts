import { test, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const url = process.env.URL || 'http://localhost:8088/';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

test('reporting', async ({ page }) => {
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
        save_screenshots: true,
    });

    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.send({ type: 'emulator-allow-unsafe-paths' });

    await TrezorUserEnvLink.api.startBridge();

    await page.goto(`${url}#/method/getAddress`);

    await page.waitForSelector("button[data-test-id='@submit-button']", { state: 'visible' });
    const [popup] = await Promise.all([
        // It is important to call waitForEvent before click to set up waiting.
        page.waitForEvent('popup'),
        // Opens popup.
        page.click("button[data-test-id='@submit-button']"),
    ]);
    await popup.waitForLoadState('load');

    // Subscribe to requests
    let requests = [];
    popup.on('request', request => {
        // ignore other than data trezor requests
        if (!request.url().startsWith('https://data.trezor.io/')) {
            return;
        }
        requests.push({ url: request.url() });
    });

    // analytics events sent yet
    expect(requests.length).toEqual(0);

    await popup.waitForSelector("div[data-test-id='@analytics/consent']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-test-id='@analytics/continue-button']");

    // analytics is now enabled, events should be sent now
    expect(requests.length).toBeGreaterThan(0);

    let localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    // should be saved in local storage
    expect(localStorage.search('"tracking_enabled\\":true')).toBeTruthy();

    await popup.click("div[data-test-id='@analytics/settings']");

    // disable analytics
    await popup.click("div[data-test-id='@analytics/toggle-switch']");

    requests = [];

    await popup.click("button[data-test-id='@analytics/continue-button']");

    // disable analytics event is sent
    expect(requests.length).toBe(1);

    await popup.waitForSelector('button.confirm', { state: 'visible' });
    await popup.click('button.confirm');

    // no other analytics events are sent
    expect(requests.length).toBe(1);

    localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));

    expect(localStorage.search('"tracking_enabled\\":false')).toBeTruthy();

    // visit page again and check that it is still in local storage
    await page.goto(`${url}#/method/getAddress`);

    localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));

    expect(localStorage.search('"tracking_enabled\\":false')).toBeTruthy();
});
