const { _electron: electron } = require('playwright');
const path = require('path');
const { promisify } = require('util');
const rmdir = promisify(require('fs').rmdir);
const fetch = require('node-fetch');
const { test, expect } = require('@playwright/test');

const { Controller, controllerManager } = require('@trezor/trezor-user-env-link');
const { patchBinaries, launchSuite, waitForDataTestSelector } = require('../support/common');

const controller = new Controller();
const manager = controllerManager(controller);

const clickDataTest = (window, selector) => window.click(`[data-test="${selector}"]`);

const toggleDebugModeInSettings = async window => {
    const timesClickToSetDebugMode = 5;
    for (let i = 0; i < timesClickToSetDebugMode; i++) {
        // eslint-disable-next-line no-await-in-loop
        await clickDataTest(window, '@settings/menu/title');
    }
};

test.describe.serial('Suite works with Electrum server', () => {
    test.beforeAll(async () => {
        // todo: some problems with path in dev and production and tests. tldr tests are expecting
        // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
        // better solution later
        await patchBinaries();
        await manager.trezorUserEnvConnect();
        await manager.startEmu({ wipe: true });
        await manager.setupEmu({
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
    });

    test('Electrum completes discovery successfully', async () => {
        suite = await launchSuite();

        await waitForDataTestSelector(suite.window, '@welcome/title');

        await clickDataTest(suite.window, '@onboarding/continue-button');

        await clickDataTest(suite.window, '@onboarding/exit-app-button');

        await waitForDataTestSelector(suite.window, '@dashboard/graph', { timeout: 30000 });

        await clickDataTest(suite.window, '@suite/menu/settings');

        await clickDataTest(suite.window, '@settings/menu/wallet');
        await toggleDebugModeInSettings(suite.window);
        await clickDataTest(suite.window, '@settings/wallet/network/regtest');

        await clickDataTest(suite.window, '@settings/wallet/network/regtest/advance');
        await clickDataTest(suite.window, '@settings/advance/select-type/input');
        await suite.window.keyboard.press('ArrowDown');
        await suite.window.keyboard.press('Enter');
        await suite.window.locator('[data-test="@settings/advance/url"]').fill('127.0.0.1:50001:t');
        await clickDataTest(suite.window, '@settings/advance/button/save');

        await clickDataTest(suite.window, '@suite/menu/suite-index');
        await waitForDataTestSelector(suite.window, '@dashboard/graph', { timeout: 30000 });

        // If the regtest value using Electrum is display it means discovery was successful.
        await waitForDataTestSelector(suite.window, '@wallet/coin-balance/value-regtest');

        suite.electronApp.close();
    });
});
