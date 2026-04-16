import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
test.beforeEach(async ({ onboardingPage, settingsPage }) => {
    await onboardingPage.completeOnboarding();
    await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
});
test.describe('Wallet discover tests', { tag: ['@T3W1', '@T3T1'] }, () => {
    test(
        'Discover a standard wallet',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully discover a standard wallet.',
                category: TestCategory.Wallets,
                priority: TestPriority.Critical,
            }),
        },
        async ({ dashboardPage, walletPage }) => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.ejectWallet();
            await dashboardPage.addStandardWallet();
            await expect(walletPage.balanceOfAccount({ symbol: 'btc', atIndex: 0 })).toBeVisible();
        },
    );
});
