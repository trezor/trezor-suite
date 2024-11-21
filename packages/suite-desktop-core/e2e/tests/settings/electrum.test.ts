import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { test as testPlaywright } from '../../support/fixtures';

testPlaywright.describe.serial('Suite works with Electrum server', () => {
    testPlaywright.beforeAll(async () => {
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.startEmu({ wipe: true });
        await TrezorUserEnvLink.setupEmu({
            needs_backup: true,
            mnemonic: 'mnemonic_all',
        });
    });

    testPlaywright(
        'Electrum completes discovery successfully',
        async ({ dashboardPage, topBar, settingsPage }) => {
            const electrumUrl = '127.0.0.1:50001:t';

            await dashboardPage.passThroughInitialRun();
            await dashboardPage.discoveryShouldFinish();

            await topBar.openSettings();
            await settingsPage.toggleDebugModeInSettings();
            await settingsPage.goToDesiredSettingsPlace('wallet');
            await settingsPage.openNetworkSettings('regtest');
            await settingsPage.changeNetworkBackend('electrum', electrumUrl);

            await topBar.openDashboard();
            await dashboardPage.discoveryShouldFinish();

            await dashboardPage.assertHasVisibleBalanceOnFirstAccount('regtest');
        },
    );
});
