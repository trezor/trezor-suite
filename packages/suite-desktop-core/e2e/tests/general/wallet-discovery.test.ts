import { test as testPlaywright, ElectronApplication, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link/src';

import { launchSuite } from '../../support/common';
import { onDashboardPage } from '../../support/pageActions/dashboardActions';

let electronApp: ElectronApplication;
let window: Page;

testPlaywright.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.startEmu({ wipe: true });
    await TrezorUserEnvLink.setupEmu({
        needs_backup: true,
        mnemonic: 'all all all all all all all all all all all all',
    });
    ({ electronApp, window } = await launchSuite());
});

testPlaywright.afterAll(() => {
    electronApp.close();
});

/**
 * Test case:
 * 1. Discover a standard wallet
 * 2. Verify discovery by checking a the first btc value under the graph
 */
testPlaywright('Discover a standard wallet', async () => {
    await onDashboardPage.passThroughInitialRun(window);
    await onDashboardPage.discoveryShouldFinish(window);

    await onDashboardPage.openDeviceSwitcher(window);
    await onDashboardPage.ejectWallet(window);
    await onDashboardPage.addStandardWallet(window);

    await onDashboardPage.assertHasVisibleBalanceOnFirstAccount(window, 'btc');
});
