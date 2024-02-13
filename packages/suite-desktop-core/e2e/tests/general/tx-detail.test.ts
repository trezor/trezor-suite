import { test as testPlaywright, ElectronApplication, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link/src';

import { launchSuite, rmDirRecursive } from '../../support/common';
import { onDashboardPage } from '../../support/pageActions/dashboardActions';
import { onSettingsPage } from '../../support/pageActions/settingsActions';
import { onTopBar } from '../../support/pageActions/topBarActions';
import { onAccountPage } from '../../support/pageActions/accountAction';

let electronApp: ElectronApplication;
let window: Page;
let localDataDir: string;

testPlaywright.beforeAll(async () => {
    await TrezorUserEnvLink.api.trezorUserEnvConnect();
    await TrezorUserEnvLink.api.startEmu({ wipe: true });
    await TrezorUserEnvLink.api.setupEmu({
        needs_backup: true,
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
 * 1. Discover a standard wallet with Ethereum and Bitcoin enabled
 * 2. Open transaction detail and check correct send icon
 * 3. Find sent transaction and check correct + sign
 * 4. Find and check internal transaction
 * 5. Find and check token transaction symbol
 */
testPlaywright('Transaction detail', async () => {
    await onDashboardPage.passThroughInitialRun(window);
    await onDashboardPage.discoveryShouldFinish(window);

    await onTopBar.openSettings(window);
    await onSettingsPage.goToDesiredSettingsPlace(window, 'wallet');
    await onSettingsPage.enableCoin(window, 'eth');

    await onTopBar.openDashboard(window);
    await onDashboardPage.discoveryShouldFinish(window);

    await window.click('[data-test="@account-menu/btc/normal/0"]');
    await onAccountPage.filterTransactions(
        window,
        '1977ac5fee52828772ce9b4a79176988f09db3e458a3fcdfd21c8a4c233ad5a1',
    );
    await window.click('[data-test="@transaction-item/0/heading"]');
    await window.waitForSelector('[data-src="/assets/0266a736e5d15aefcb82.svg"]');
    await window.getByText('Amount –').isVisible();
    await window.click('[data-test="@modal/close-button"]');

    await window.click('[data-test="@account-menu/eth/normal/0"]');
    await onAccountPage.filterTransactions(
        window,
        '0x1f7ab5ce62ef443b8cac092d9bb0266e7ddd7615856b5cf0d9a9e6f943c0b65b',
    );
    await window.click('[data-test="@transaction-item/0/heading"]');
    await window.getByText('Approve').isVisible();
    await window.click('[data-test="@modal/close-button"]');

    await window.click('[data-test="@account-menu/eth/normal/0"]');
    await onAccountPage.filterTransactions(
        window,
        '0x9dc9b9c884aad768328f28e8194f1f86121f6c2a1742fa817c33bcc2f3b7aa3c',
    );
    await window.click('[data-test="@transaction-item/0/heading"]');
    await window.getByText('Sent FOX').isVisible();
    await window.click('[data-test="@modal/close-button"]');
});
