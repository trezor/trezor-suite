import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.beforeEach(async ({ onboardingPage, settingsPage }) => {
    await onboardingPage.completeOnboarding();
    await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
});

// The @perf tag marks this as a performance-measurement host.
test.describe('Wallet discover tests', { tag: ['@T3W1', '@T3T1', '@perf'] }, () => {
    test(
        'Discover a standard wallet',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully discover a standard wallet.',
                category: TestCategory.Wallets,
                priority: TestPriority.Critical,
            }),
        },
        async ({ dashboardPage, walletPage, perf }) => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.ejectWallet();

            await perf.measure('wallet-discovery', async () => {
                await dashboardPage.addStandardWallet();
            });

            await expect(walletPage.balanceOfAccount({ symbol: 'btc', atIndex: 0 })).toBeVisible();

            // A natural spot for rerender loops: selected-account change plus account view re-render.
            await perf.measure('account-switch', async () => {
                await walletPage.openAccount({ symbol: 'btc' });
            });
        },
    );
});
