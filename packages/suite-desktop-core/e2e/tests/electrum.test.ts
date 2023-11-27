import { Page, test as testPlaywright } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { clickDataTest, launchSuite, waitForDataTestSelector } from '../support/common';

const toggleDebugModeInSettings = async (window: Page) => {
    const timesClickToSetDebugMode = 5;
    for (let i = 0; i < timesClickToSetDebugMode; i++) {
        // eslint-disable-next-line no-await-in-loop
        await clickDataTest(window, '@settings/menu/title');
    }
};

testPlaywright.describe.serial('Suite works with Electrum server', () => {
    testPlaywright.beforeAll(async () => {
        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await TrezorUserEnvLink.api.startEmu({ wipe: true });
        await TrezorUserEnvLink.api.setupEmu({
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
    });

    testPlaywright('Electrum completes discovery successfully', async () => {
        const suite = await launchSuite();

        await waitForDataTestSelector(suite.window, '@welcome/title');

        await clickDataTest(suite.window, '@analytics/continue-button');

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
