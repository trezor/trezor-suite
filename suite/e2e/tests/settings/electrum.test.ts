import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.describe(
    'Suite works with Electrum server',
    { tag: ['@desktopOnly', '@T3W1', '@T3T1'] },
    () => {
        test.beforeEach(async ({ onboardingPage, settingsPage }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('application');
            await settingsPage.toggleDebugModeInSettings();
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
            async ({ page, dashboardPage, assetsSection, settingsPage, walletPage }) => {
                test.info().annotations.push({
                    type: 'dependency',
                    description:
                        'This test needs running RegTest docker. Read how to run this dependency in docs/tests/regtest.md',
                });
                const electrumUrl = '127.0.0.1:50001:t';

                await settingsPage.toggleTestnetNetworks();
                await settingsPage.navigateTo('coins');
                await settingsPage.coinsTab.openNetworkAdvanceSettings('regtest');
                await settingsPage.coinsTab.changeBackend('electrum', electrumUrl);

                await dashboardPage.navigateTo();
                await page.discoveryShouldFinish();
                await expect(
                    walletPage.balanceOfAccount({ symbol: 'regtest', atIndex: 0 }),
                ).toBeVisible();
                await expect(assetsSection.assetFiatAmount('regtest')).toBeVisible();
            },
        );
    },
);
