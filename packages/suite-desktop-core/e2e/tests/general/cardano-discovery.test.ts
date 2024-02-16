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

    await onWalletPage.clickAllAccountArrows(window);
    await onWalletPage.enableAllCardanoAccounts(window);

    expectPlaywright(await onWalletPage.getAccountsCount(window, 'ada')).toEqual(3);
});
