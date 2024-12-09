import { test, expect } from '../../support/fixtures';

test.use({
    emulatorStartConf: { wipe: true },
    emulatorSetupConf: {
        needs_backup: true,
        mnemonic:
            'cloth trim improve bag pigeon party wave mechanic beyond clean cake maze protect left assist carry guitar bridge nest faith critic excuse tooth dutch',
    },
});

test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
    await onboardingPage.completeOnboarding();
    await dashboardPage.discoveryShouldFinish();
});

/**
 * Test case:
 * 1. Enable cardano and wait for discovery to finish
 * 2. Check that all types of Cardano accounts are discovered
 * 3. Check that Staking section is available
 */
test(
    'Discover all Cardano account types',
    { tag: ['@group=wallet'] },
    async ({ dashboardPage, settingsPage, walletPage }) => {
        await settingsPage.navigateTo();
        await settingsPage.coinsTabButton.click();
        await settingsPage.enableNetwork('ada');
        await settingsPage.disableNetwork('btc');

        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();

        await walletPage.expandAllAccountsInMenu();
        await walletPage.checkStakesOfCardanoAccounts();

        expect(await walletPage.getAccountsCount('ada')).toEqual(3);
    },
);
