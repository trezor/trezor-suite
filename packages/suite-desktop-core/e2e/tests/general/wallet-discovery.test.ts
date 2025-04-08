import { createTestAnnotation } from '../../support/annotations';
import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';

test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
test.beforeEach(async ({ onboardingPage }) => {
    await onboardingPage.completeOnboarding();
});
test.describe('Wallet discover tests', { tag: ['@group=wallet'] }, () => {
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
            await expect(walletPage.balanceOfAccount('btc').first()).toBeVisible();
        },
    );
});
