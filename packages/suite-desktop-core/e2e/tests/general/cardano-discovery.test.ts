import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link/src';

import { test, expect } from '../../support/fixtures';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.startEmu({ wipe: true });
    await TrezorUserEnvLink.setupEmu({
        needs_backup: true,
        mnemonic:
            'cloth trim improve bag pigeon party wave mechanic beyond clean cake maze protect left assist carry guitar bridge nest faith critic excuse tooth dutch',
    });
});

test.afterAll(() => {
    TrezorUserEnvLink.stopEmu();
});

/**
 * Test case:
 * 1. Enable cardano and wait for discovery to finish
 * 2. Check that all types of Cardano accounts are discovered
 * 3. Check that Staking section is available
 */
test.skip('Discover all Cardano account types', async ({
    dashboardPage,
    topBar,
    settingsPage,
    walletPage,
}) => {
    await dashboardPage.passThroughInitialRun();
    await dashboardPage.discoveryShouldFinish();

    await topBar.openSettings();
    await settingsPage.goToDesiredSettingsPlace('wallet');
    await settingsPage.enableCoin('ada');
    await settingsPage.enableCoin('btc');

    await topBar.openDashboard();
    await dashboardPage.discoveryShouldFinish();

    await walletPage.clickAllAccountArrows();
    await walletPage.enableAllCardanoAccounts();

    expect(await walletPage.getAccountsCount('ada')).toEqual(3);
});
