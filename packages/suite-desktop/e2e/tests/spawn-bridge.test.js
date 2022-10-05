const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { test, expect } = require('@playwright/test');

const { patchBinaries, launchSuite, waitForDataTestSelector } = require('../support/common');
const { TrezorUserEnvLink } = require('@trezor/trezor-user-env-link');

test.describe.serial('Bridge', () => {
    test.beforeAll(async () => {
        // todo: some problems with path in dev and production and tests. tldr tests are expecting
        // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
        // better solution later
        await patchBinaries();
        // We make sure that bridge from trezor-user-env is stopped.
        // So we properly test the electron app spawning bridge binary.
        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await TrezorUserEnvLink.api.stopBridge();
    });

    test.afterAll(async () => {
        // When finish we make bridge from trezor-user-env to run so it is ready for the rest of the tests.
        await TrezorUserEnvLink.api.startBridge();
    });

    test('App spawns bundled bridge and stops it after app quit', async ({ request }) => {
        const suite = await launchSuite();
        const title = await suite.window.title();
        expect(title).toBe('Trezor Suite');

        // We wait for `@welcome/title` or `@dashboard/graph` since
        // one or the other will be display depending on the state of the app
        // due to previously run tests. And both means the same for the porpoise of this test.
        // Bridge should be ready to check `/status` endpoint.
        await Promise.race([
            waitForDataTestSelector(suite.window, '@welcome/title'),
            waitForDataTestSelector(suite.window, '@dashboard/graph'),
        ]);

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
