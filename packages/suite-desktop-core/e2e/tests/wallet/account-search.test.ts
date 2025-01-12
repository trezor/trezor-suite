import { test, expect } from '../../support/fixtures';

test.describe('Look up a BTC account', { tag: ['@group=wallet'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'cancel solid bulb sample fury scrap whale ranch raven razor sight skin',
        },
    });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.enableNetwork('ltc');
    });

    test('Search for bitcoin in accounts', async ({ dashboardPage, walletPage }) => {
        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.accountSearch.fill('bitcoin');
        await expect(walletPage.accountButton({ symbol: 'ltc' })).not.toBeVisible();
        await expect(walletPage.accountButton({ symbol: 'btc' })).toBeVisible();
        await walletPage.accountSearch.clear();
        await expect(walletPage.accountButton({ symbol: 'ltc' })).toBeVisible();
        await expect(walletPage.accountButton({ symbol: 'btc' })).toBeVisible();
    });
});
