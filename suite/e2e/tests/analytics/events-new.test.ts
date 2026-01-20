import { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { PromoBannerType } from '../../support/pageObjects/dashboardPage';

test.describe('New Analytics Events', { tag: ['@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['eth', 'ada'],
        });
    });

    // --- Staking Navigation Events ---
    const coins: NetworkSymbol[] = ['eth', 'ada'];
    const STAKING_EVENT = 'staking/navigate';

    for (const coin of coins) {
        test(
            `Should log the event ${STAKING_EVENT} - ${coin.toUpperCase()} from account menu`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verify that the ${STAKING_EVENT} event is logged for ${coin.toUpperCase()} when navigating from the account menu`,
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ analyticsSection, walletPage }) => {
                await walletPage.openAccount({ symbol: coin });

                const [payload] = await Promise.all([
                    analyticsSection.waitForAnalytics({
                        c_type: STAKING_EVENT,
                        networkSymbol: coin,
                    }),
                    walletPage.stakingButton.click(),
                ]);

                expect(payload).toMatchObject({ c_type: STAKING_EVENT, networkSymbol: coin });
            },
        );

        test(
            `Should log ${STAKING_EVENT} - ${coin.toUpperCase()} from dashboard assets`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verify that the ${STAKING_EVENT} event is logged for ${coin.toUpperCase()} when navigating from the dashboard`,
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ analyticsSection, dashboardPage }) => {
                await dashboardPage.navigateTo();

                const [payload] = await Promise.all([
                    analyticsSection.waitForAnalytics({
                        c_type: STAKING_EVENT,
                        networkSymbol: coin,
                    }),
                    dashboardPage.stakeButton(coin).click(),
                ]);

                expect(payload).toMatchObject({ c_type: STAKING_EVENT, networkSymbol: coin });
            },
        );
    }

    // --- Promo Banner Events ---
    const bannerTypes: PromoBannerType[] = ['tex', 'ts7'];
    const PROMO_EVENT = 'promo/dashboard-banner';

    for (const bannerType of bannerTypes) {
        test(
            `Should log ${PROMO_EVENT} - ${bannerType.toLocaleUpperCase()} from dashboard promo banner`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verify that the ${PROMO_EVENT} event is logged for ${bannerType.toUpperCase()} when navigating from the dashboard promo banner`,
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ analyticsSection, dashboardPage, settingsPage }) => {
                await test.step('Add dashboard promo banner', async () => {
                    await settingsPage.toggleDebugModeInSettings();
                    await settingsPage.navigateTo('debug');
                    await settingsPage.debugTab.addBanner(bannerType);
                });

                await test.step(`Tirgger & verify ${PROMO_EVENT} - ${bannerType.toUpperCase()}`, async () => {
                    await dashboardPage.navigateTo();

                    const [payload] = await Promise.all([
                        analyticsSection.waitForAnalytics({ c_type: PROMO_EVENT, bannerType }),
                        dashboardPage.promoBannerButton(bannerType).click(),
                    ]);

                    expect(payload).toMatchObject({ c_type: PROMO_EVENT, bannerType });
                });
            },
        );
    }
});
