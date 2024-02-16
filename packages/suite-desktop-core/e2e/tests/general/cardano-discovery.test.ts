import {
    test as testPlaywright,
    expect as expectPlaywright,
    ElectronApplication,
    Page,
} from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link/src';

import { launchSuite, rmDirRecursive } from '../../support/common';
import { onDashboardPage } from '../../support/pageActions/dashboardActions';
import { onTopBar } from '../../support/pageActions/topBarActions';
import { onSettingsPage } from '../../support/pageActions/settingsActions';
import { onWalletPage } from '../../support/pageActions/walletActions';

let electronApp: ElectronApplication;
let window: Page;
let localDataDir: string;

testPlaywright.beforeAll(async () => {
    await TrezorUserEnvLink.api.trezorUserEnvConnect();
    await TrezorUserEnvLink.api.startEmu({ wipe: true });
    await TrezorUserEnvLink.api.setupEmu({
        needs_backup: true,
        mnemonic:
            'cloth trim improve bag pigeon party wave mechanic beyond clean cake maze protect left assist carry guitar bridge nest faith critic excuse tooth dutch',
    });
    ({ electronApp, window, localDataDir } = await launchSuite());
    rmDirRecursive(localDataDir);
});

testPlaywright.afterAll(() => {
    electronApp.close();
    TrezorUserEnvLink.api.stopEmu();
});

/**
 * Test case:
 * 1. Enable cardano and wait for discovery to finish
 * 2. Check that all types of Cardano accounts are discovered
 * 3. Check that Staking section is available
 */
testPlaywright('Discover all Cardano account types', async () => {
    await onDashboardPage.passThroughInitialRun(window);
    await onDashboardPage.discoveryShouldFinish(window);

    await onTopBar.openSettings(window);
    await onSettingsPage.goToDesiredSettingsPlace(window, 'wallet');
    await onSettingsPage.enableCoin(window, 'ada');
    await onSettingsPage.enableCoin(window, 'btc');

    await onTopBar.openDashboard(window);
    await onDashboardPage.discoveryShouldFinish(window);
    await window.click('[data-test="@account-menu/ada/normal/0"]');
    await onDashboardPage.assertHasVisibleBalanceOnFirstAccount(window, 'ada');
    await window.getByTestId('data-test="@wallet/menu/wallet-staking"').click;
    await window.getByText('Cardano Staking');
    await onWalletPage.clickAllAccountArrows(window);

    await window.click('[data-test="@account-menu/ada/legacy/0"]');
    await onDashboardPage.assertHasVisibleBalanceOnFirstAccount(window, 'ada');

    await window.click('[data-test="@account-menu/ada/ledger/0"]');
    await onDashboardPage.assertHasVisibleBalanceOnFirstAccount(window, 'ada');

    expectPlaywright(await window.getByTestId('@wallet/menu/wallet-staking]'));
});
