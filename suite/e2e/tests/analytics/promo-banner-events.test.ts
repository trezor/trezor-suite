import { EventType } from '@suite/analytics/src/constants';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { isDesktopProject } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { PromoBannerType } from '../../support/pageObjects/dashboardPage';

test.describe('Analytics Events - Promo Banner', { tag: ['@T3T1', '@nightlyOnly'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await settingsPage.navigateTo('debug');
    });

    // --- Promo Banner Events ---
    const bannerTypes: PromoBannerType[] = ['tex', 'ts7'];

    for (const bannerType of bannerTypes) {
        test(
            `Should log ${EventType.PromoDashboardBanner} - ${bannerType.toLocaleUpperCase()} from dashboard promo banner`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verify that the ${EventType.PromoDashboardBanner} event is logged for ${bannerType.toUpperCase()} when navigating from the dashboard promo banner`,
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ analyticsHelper, dashboardPage, settingsPage, page, target }) => {
                await test.step('Add dashboard promo banner', async () => {
                    await settingsPage.debugTab.addBanner(bannerType);
                });

                await test.step(`Trigger & verify ${EventType.PromoDashboardBanner} - ${bannerType.toUpperCase()}`, async () => {
                    await dashboardPage.navigateTo();

                    /**
                     * Set up listener
                     *
                     * analyticsPromise - wait for the analytics event
                     */
                    const analyticsPromise = analyticsHelper.waitForEvent({
                        c_type: EventType.PromoDashboardBanner,
                        bannerType,
                    });

                    let payload: Record<string, string | null>;

                    if (isDesktopProject(target)) {
                        // Perform the action
                        await dashboardPage.promoBannerButton(bannerType).click();

                        // Await the listeners
                        payload = await analyticsPromise;
                    } else {
                        /**
                         * Set up listener
                         *
                         * pagePromise - wait for new page being opened by open the link from the banner
                         */
                        const pagePromise = page.context().waitForEvent('page');
                        // Perform the action
                        await dashboardPage.promoBannerButton(bannerType).click();

                        // Await the listeners
                        const [analyticsPayload, newPage] = await Promise.all([
                            analyticsPromise,
                            pagePromise,
                        ]);
                        payload = analyticsPayload;

                        await newPage.close();
                    }

                    expect(payload).toMatchObject({
                        c_type: EventType.PromoDashboardBanner,
                        bannerType,
                    });
                });
            },
        );
    }
});
