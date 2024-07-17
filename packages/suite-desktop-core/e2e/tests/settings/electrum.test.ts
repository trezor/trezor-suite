import { test as testPlaywright, ElectronApplication, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { launchSuite } from '../../support/common';
import { onTopBar } from '../../support/pageActions/topBarActions';
import { onSettingsPage } from '../../support/pageActions/settingsActions';
import { onDashboardPage } from '../../support/pageActions/dashboardActions';

let electronApp: ElectronApplication;
let window: Page;

testPlaywright.describe.serial('Suite works with Electrum server', () => {
    testPlaywright.beforeAll(async () => {
        await TrezorUserEnvLink.api.stopBridge();
        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await TrezorUserEnvLink.api.startEmu({ wipe: true });
        await TrezorUserEnvLink.api.setupEmu({
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        ({ electronApp, window } = await launchSuite());
    });

    testPlaywright.afterAll(() => {
        electronApp.close();
    });

    testPlaywright('Electrum completes discovery successfully', async () => {
        const electrumUrl = '127.0.0.1:50001:t';

        await onDashboardPage.passThroughInitialRun(window);
        await onDashboardPage.discoveryShouldFinish(window);

        await onTopBar.openSettings(window);
        await onSettingsPage.toggleDebugModeInSettings(window);
        await onSettingsPage.goToDesiredSettingsPlace(window, 'wallet');
        await onSettingsPage.openNetworkSettings(window, 'regtest');
        await onSettingsPage.changeNetworkBackend(window, 'electrum', electrumUrl);

        await onTopBar.openDashboard(window);
        await onDashboardPage.discoveryShouldFinish(window);

        await onDashboardPage.assertHasVisibleBalanceOnFirstAccount(window, 'regtest');

        electronApp.close();
    });
});
