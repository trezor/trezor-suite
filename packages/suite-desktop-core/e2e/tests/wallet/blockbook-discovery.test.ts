import { TestAnnotationType, TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';

test.describe('Custom-blockbook-discovery', { tag: ['@group=wallet'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('BTC blockbook discovery', {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verify that a user can successfully set up Blockbook backend.',
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Dashboard,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: 'TODO',
                },
            ]
        }, async ({ settingsPage, dashboardPage }) => {
        const btcBlockbook = 'https://btc1.trezor.io';
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.openNetworkAdvanceSettings('btc');
        await settingsPage.coins.changeBackend('blockbook', btcBlockbook);
        await dashboardPage.navigateTo();
        await expect(dashboardPage.graph).toBeVisible();
        //TODO: Improve verification
    });

    test('LTC blockbook discovery', async ({ page, settingsPage, dashboardPage }) => {
        const ltcBlockbook = 'https://ltc1.trezor.io';
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.disableNetwork('btc');
        await settingsPage.coins.enableNetwork('ltc');
        await settingsPage.coins.openNetworkAdvanceSettings('ltc');
        await settingsPage.coins.changeBackend('blockbook', ltcBlockbook);
        await dashboardPage.navigateTo();
        await page.discoveryShouldFinish();
        await expect(dashboardPage.graph).toBeVisible();
        //TODO: Improve verification
    });
});
