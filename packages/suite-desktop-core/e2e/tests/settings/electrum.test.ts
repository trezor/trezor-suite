import { createTestAnnotation } from '../../support/annotations';
import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';

test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
test.describe(
    'Suite works with Electrum server',
    { tag: ['@group=settings', '@desktopOnly'] },
    () => {
        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.completeOnboarding();
        });

        test(
            'Electrum completes discovery successfully',
            {
                annotation: createTestAnnotation({
                    testCase: 'Verify that a user can successfully set up Electrum backend.',
                    category: TestCategory.Dashboard,
                    priority: TestPriority.High,
                }),
            },
            async ({ page, dashboardPage, settingsPage, walletPage }) => {
                test.info().annotations.push({
                    type: 'dependency',
                    description:
                        'This test needs running RegTest docker. Read how to run this dependency in docs/tests/regtest.md',
                });
                const electrumUrl = '127.0.0.1:50001:t';

                await settingsPage.navigateTo('coins');
                await settingsPage.coins.openNetworkAdvanceSettings('regtest');
                await settingsPage.coins.changeBackend('electrum', electrumUrl);

                await dashboardPage.navigateTo();
                await page.discoveryShouldFinish();

                await expect(walletPage.balanceOfAccount('regtest').first()).toBeVisible();
            },
        );
    },
);
