import { expect, test } from '../../support/fixtures';

/**
 * `mnemonic_all` is funded across many coins, so enabling btc + eth + ltc updates many account
 * entities at once — far more account churn than the single-account `wallet-discovery` scenario,
 * while needing no passphrase and no THP so it still runs on Safe 5.
 */
test.describe('Performance', { tag: ['@T3W1', '@T3T1', '@perf'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc', 'eth', 'ltc'] });
    });

    test('multi-account discovery stays within its performance limits', async ({
        dashboardPage,
        walletPage,
        perf,
    }) => {
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.ejectWallet();

        await perf.measure('multi-account-discovery', async () => {
            await dashboardPage.addStandardWallet();
        });

        await expect(walletPage.balanceOfAccount({ symbol: 'btc', atIndex: 0 })).toBeVisible();
    });
});
