const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { test, expect } = require('@playwright/test');
const { patchBinaries, launchSuite } = require('../support/common');

const getTestElement = async (window, dataTest) => {
    const selector = `[data-test="${dataTest}"]`;
    const el = await window.locator(selector);
    if (!el) {
        // todo: normally I would retry here. Is there built in retryability in playwright?
        throw new Error(`element: ${selector} does not exist`);
    }
    await expect(el).toBeVisible();
    return el;
};

test.describe.serial('Bridge', () => {
    test.beforeAll(async () => {
        // todo: some problems with path in dev and production and tests. tldr tests are expecting
        // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
        // better solution later
        await patchBinaries();
    });

    test('App spawns bundled bridge and stops it after app quit', async ({ request }) => {
        const suite = await launchSuite();
        await suite.electronApp.firstWindow();
        const title = await suite.window.title();
        expect(title).toBe('Trezor Suite');

        const titleEl = await getTestElement(suite.window, '@welcome/title');

        // bridge is running
        const bridgeRes1 = await request.get('http://127.0.0.1:21325/status/');
        await expect(bridgeRes1).toBeOK();

        await suite.electronApp.close();

        // bridge is not running
        try {
            await request.get('http://127.0.0.1:21325/status/');
            throw new Error('should have thrown!');
        } catch (err) {
            // ok
        }
    });
});
