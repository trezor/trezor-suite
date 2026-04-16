import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Look up a BTC account', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'cancel solid bulb sample fury scrap whale ranch raven razor sight skin',
        },
    });
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc', 'ltc'] });
    });

    test(
        'Search for bitcoin in accounts',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can search for a BTC account.',
                category: TestCategory.BTC,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async ({ dashboardPage, walletPage }) => {
            await dashboardPage.navigateTo();
            await walletPage.accountSearch.fill('bitcoin');
            await expect(walletPage.accountButton({ symbol: 'ltc' })).toBeHidden();
            await expect(walletPage.accountButton({ symbol: 'btc' })).toBeVisible();
            await walletPage.accountSearch.clear();
            await expect(walletPage.accountButton({ symbol: 'ltc' })).toBeVisible();
            await expect(walletPage.accountButton({ symbol: 'btc' })).toBeVisible();
        },
    );
});
