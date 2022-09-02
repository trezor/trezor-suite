const { _electron: electron } = require('playwright');
const path = require('path');
const { promisify } = require('util');
const rmdir = promisify(require('fs').rmdir);
const fetch = require('node-fetch');
const { test, expect } = require('@playwright/test');

const { Controller } = require('../../../websocket-client');
const { patchBinaries, launchSuite } = require('../support/common');
const { NetworkAnalyzer } = require('../support/networkAnalyzer');

const controller = new Controller();

const turnOnTorInSettings = async (window, shouldEnableTor = true) => {
    await window.click('[data-test="@suite/menu/settings"]');
    await window.waitForSelector('[data-test="@settings/general/tor-switch"]');
    const torIAlreadyEnabled = await window.isChecked(
        '[data-test="@settings/general/tor-switch"] > input',
    );
    if ((shouldEnableTor && torIAlreadyEnabled) || (!shouldEnableTor && !torIAlreadyEnabled)) {
        // If tor is already enabled, we return early.
        return;
    }

    await window.click('[data-test="@settings/general/tor-switch"]');
    await window.waitForSelector('[data-test="@loading-content/loader"]', {
        state: 'visible',
    });
    await window.waitForSelector('[data-test="@loading-content/loader"]', {
        state: 'detached',
        timeout: 12 * 1000, // 12 seconds, because it takes a while to start tor.
    });
    await expect(
        window.locator('[data-test="@settings/general/tor-switch"] > input'),
    ).toBeChecked();

    await window.waitForTimeout(1000);
};

test.describe('Tor loading screen', () => {
    test.beforeAll(async () => {
        controller.connect();

        // todo: some problems with path in dev and production and tests. tldr tests are expecting
        // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
        // better solution later
        await patchBinaries();
    });

    test('Tor loading screen: happy path', async () => {
        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();

        await suite.window.waitForSelector('[data-test="@tor-loading-screen"]', {
            state: 'visible',
        });

        await suite.window.waitForSelector('[data-test="@welcome/title"]', { timeout: 15000 });

        suite.electronApp.close();
    });

    test('Tor loading screen: making sure that all the request go throw Tor', async () => {
        const networkAnalyzer = new NetworkAnalyzer();

        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();
        // Start network analyzer after making sure tor is going to be running.
        networkAnalyzer.start();

        await suite.window.waitForSelector('[data-test="@tor-loading-screen"]', {
            state: 'visible',
        });

        await suite.window.waitForSelector('[data-test="@welcome/title"]', { timeout: 15000 });
        networkAnalyzer.stop();
        const requests = networkAnalyzer.getRequests();
        requests.forEach(request => {
            expect(request).toContain('localhost:');
        });

        suite.electronApp.close();
    });

    test('Tor loading screen: disable tor while loading', async ({ request }) => {
        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();

        await suite.window.waitForSelector('[data-test="@tor-loading-screen"]', {
            state: 'visible',
        });
        await suite.window.click('[data-test="@tor-loading-screen/disable-button"]');

        // disabling loader appears and disappears
        suite.window.locator('text=Disabling Tor');
        await suite.window.click('[data-test="@suite/menu/settings"]');

        await expect(
            suite.window.locator('[data-test="@settings/general/tor-switch"] > input'),
        ).not.toBeChecked();

        suite.electronApp.close();
    });
});
