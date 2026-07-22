import { EventType } from '@suite/analytics/src/constants';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';

test.describe('Analytics Events - Staking Navigate', { tag: ['@T3W1', '@nightlyOnly'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['eth', 'ada'],
        });
    });

    // --- Staking Navigation Events ---
    const coins: NetworkSymbol[] = ['eth', 'ada'];

    for (const coin of coins) {
        test(
            `Should log the event ${EventType.StakingNavigate} - ${coin.toUpperCase()} from account menu`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verify that the ${EventType.StakingNavigate} event is logged for ${coin.toUpperCase()} when navigating from the account menu`,
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ analyticsHelper, walletPage }) => {
                await walletPage.openAccount({ symbol: coin });

                // Set up listeners
                const analyticsPromise = analyticsHelper.waitForEvent({
                    c_type: EventType.StakingNavigate,
                    networkSymbol: coin,
                });

                // Perform the action
                await walletPage.stakingButton.click();

                // Await the listeners
                const payload = await analyticsPromise;

                expect(payload).toMatchObject({
                    c_type: EventType.StakingNavigate,
                    networkSymbol: coin,
                });
            },
        );

        test(
            `Should log ${EventType.StakingNavigate} - ${coin.toUpperCase()} from dashboard assets`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verify that the ${EventType.StakingNavigate} event is logged for ${coin.toUpperCase()} when navigating from the dashboard`,
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ analyticsHelper, dashboardPage }) => {
                await dashboardPage.navigateTo();

                // Set up listeners
                const analyticsPromise = analyticsHelper.waitForEvent({
                    c_type: EventType.StakingNavigate,
                    networkSymbol: coin,
                });

                // Perform the actin
                await dashboardPage.stakeButton(coin).click();

                // Await the listeners
                const payload = await analyticsPromise;

                expect(payload).toMatchObject({
                    c_type: EventType.StakingNavigate,
                    networkSymbol: coin,
                });
            },
        );
    }
});
