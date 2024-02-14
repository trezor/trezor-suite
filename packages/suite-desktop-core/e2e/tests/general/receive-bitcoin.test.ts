import { test as testPlaywright, ElectronApplication, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link/src';

import { launchSuite, rmDirRecursive } from '../../support/common';
import { onDashboardPage } from '../../support/pageActions/dashboardActions';

let electronApp: ElectronApplication;
let window: Page;
let localDataDir: string;

testPlaywright.beforeAll(async () => {
    await TrezorUserEnvLink.api.trezorUserEnvConnect();
    await TrezorUserEnvLink.api.startEmu({ wipe: true });
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'all all all all all all all all all all all all',
    });
    ({ electronApp, window, localDataDir } = await launchSuite());
    rmDirRecursive(localDataDir);
});

testPlaywright.afterAll(() => {
    electronApp.close();
});

/**
 * Test case:
 * 1. Discover a standard wallet
 * 2. Verify discovery by checking a the first btc value under the graph
 * 3. Open first account and verify receive address
 * 4. Confirm on device
 * 5. Copy address
 * 6. Check notification
 * 7. Close modal
 */
testPlaywright('Discover a standard wallet', async () => {
    await onDashboardPage.passThroughInitialRun(window);
    await onDashboardPage.discoveryShouldFinish(window);

    const deviceSwitcher = await onDashboardPage.openDeviceSwitcherAndReturnWindow(window);
    await onDashboardPage.ejectWallet(deviceSwitcher, 'Standard wallet');
    await onDashboardPage.addStandardWallet(window);

    await onDashboardPage.assertHasVisibleBalanceOnFirstAccount(window, 'btc');

    await window.click('[data-test="@account-menu/btc/normal/0"]');
    await window.click('[data-test="@wallet/menu/wallet-receive"]');
    await window.click('[data-test="@wallet/receive/reveal-address-button"]');
    await window.getByText('bc1q65f3kvtl54uqj2um9wv2cmf3hkefskzt29dd2z').isVisible();
    await TrezorUserEnvLink.api.pressYes();
    await TrezorUserEnvLink.api.pressYes(); //added second pressYes due to flakiness of test
    await window.getByText('Address confirmed').isVisible();
    await window.click('[data-test="@metadata/copy-address-button"]');
    await window.getByText('Copied to clipboard').isVisible();
    await window.click('[data-test="@modal/close-button"]');
});
