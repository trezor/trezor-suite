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
test('Discover all Cardano account types', async ({
    onboardingPage,
    dashboardPage,
    settingsPage,
    walletPage,
}) => {
    await onboardingPage.completeOnboarding();
    await dashboardPage.discoveryShouldFinish();
    await settingsPage.navigateTo();
    await settingsPage.coinsTabButton.click();
    await settingsPage.enableCoin('ada');
    await settingsPage.disableCoin('btc');

    await dashboardPage.navigateTo();
    await dashboardPage.discoveryShouldFinish();

    await walletPage.expandAllAccountsInMenu();
    await walletPage.checkStakesOfCardanoAccounts();

    expect(await walletPage.getAccountsCount('ada')).toEqual(3);
});
