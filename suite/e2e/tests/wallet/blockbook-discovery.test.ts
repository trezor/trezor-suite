import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

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
                stream: TestStream.Network,
            }),
        },
        async ({ page, settingsPage, dashboardPage }) => {
            const btcBlockbook = 'https://btc.trezor.io';
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: 'btc', backend: { type: 'blockbook', url: btcBlockbook } },
                ],
                skipActivation: true,
            });
            await dashboardPage.navigateTo();
            await page.discoveryShouldFinish();
            await expect(dashboardPage.graph).toBeVisible();
            //TODO: Improve verification
        },
    );

    test(
        'LTC blockbook discovery',
        { annotation: createTestAnnotation({ stream: TestStream.Network }) },
        async ({ settingsPage, dashboardPage }) => {
            const ltcBlockbook = 'https://ltc.trezor.io';
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: 'ltc', backend: { type: 'blockbook', url: ltcBlockbook } },
                ],
            });
            await dashboardPage.navigateTo();
            await expect(dashboardPage.graph).toBeVisible();
            //TODO: Improve verification
        },
    );
});
