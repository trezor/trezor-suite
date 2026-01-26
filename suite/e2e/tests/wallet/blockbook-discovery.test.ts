import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Custom-blockbook-discovery', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'BTC blockbook discovery',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully set up Blockbook backend.',
                category: TestCategory.Dashboard,
                priority: TestPriority.High,
            }),
        },
        async ({ settingsPage, dashboardPage }) => {
            const btcBlockbook = 'https://btc.trezor.io';
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.openNetworkAdvanceSettings('btc');
            await settingsPage.coins.changeBackend('blockbook', btcBlockbook);
            await dashboardPage.navigateTo();
            await expect(dashboardPage.graph).toBeVisible();
            //TODO: Improve verification
        },
    );

    test('LTC blockbook discovery', async ({ page, settingsPage, dashboardPage }) => {
        const ltcBlockbook = 'https://ltc.trezor.io';
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
