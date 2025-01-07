import { test, expect } from '../../support/fixtures';

test.describe('Custom-blockbook-discovery', { tag: ['@group=wallet'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true },
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('BTC blockbook discovery', async ({ settingsPage, dashboardPage }) => {
        const btcBlockbook = 'https://btc1.trezor.io';
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.openNetworkAdvanceSettings('btc');
        await settingsPage.coins.changeBackend('blockbook', btcBlockbook);
        await dashboardPage.navigateTo();
        await expect(dashboardPage.graph).toBeVisible();
        //TODO: Improve verification
    });

    test('LTC blockbook discovery', async ({ settingsPage, dashboardPage }) => {
        const ltcBlockbook = 'https://ltc1.trezor.io';
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.disableNetwork('btc');
        await settingsPage.coins.enableNetwork('ltc');
        await settingsPage.coins.openNetworkAdvanceSettings('ltc');
        await settingsPage.coins.changeBackend('blockbook', ltcBlockbook);
        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();
        await expect(dashboardPage.graph).toBeVisible();
        //TODO: Improve verification
    });
});
