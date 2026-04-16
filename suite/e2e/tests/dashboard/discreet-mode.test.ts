import { Locator } from '@playwright/test';

import { events } from '@suite/analytics';
import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { ExtractByEventType } from '../../support/types';

const verifyHiddenAndRevealedValue = async ({
    locator,
    hiddenValue = '$###',
    revealedValue = '$0.00',
}: {
    locator: Locator;
    hiddenValue?: string;
    revealedValue?: string;
}) => {
    await expect.soft(locator).toHaveText(hiddenValue);
    // Value is revealed on hover over text. But the locator might cover larger area then the text itself
    // Text is centered to the left, so we click on 0,0
    await locator.hover({ position: { x: 0, y: 0 } });
    await expect.soft(locator).toHaveText(revealedValue);
};

test.describe('Discreet Mode', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ analytics, onboardingPage, settingsPage }) => {
        await analytics.interceptAnalytics();
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
    });

    test(
        'Balances are hidden when user enables discreet mode',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that enabling discreet mode hides balances across the dashboard and triggers the correct analytics event.',
                category: TestCategory.Settings,
                priority: TestPriority.High,
            }),
        },
        async ({ analytics, assetsSection, dashboardPage, walletPage }) => {
            await dashboardPage.hideBalanceButton.click();

            await test.step('Verify account value is hidden', async () => {
                await verifyHiddenAndRevealedValue({
                    locator: walletPage.balanceOfAccount({ symbol: 'btc' }),
                    hiddenValue: '###',
                    revealedValue: '0',
                });
            });

            await test.step('Verify asset card value is hidden', async () => {
                await verifyHiddenAndRevealedValue({
                    locator: assetsSection.assetFiatAmount('btc'),
                });
            });

            await test.step('Verify asset row value is hidden', async () => {
                await assetsSection.tableIcon.click();
                await verifyHiddenAndRevealedValue({
                    locator: assetsSection.assetFiatAmount('btc'),
                });
            });

            await test.step('Verify Portfolio value is hidden', async () => {
                await verifyHiddenAndRevealedValue({ locator: dashboardPage.portfolioFiatAmount });
            });

            await test.step('Verify wallet value is hidden', async () => {
                await dashboardPage.deviceSwitchingOpenButton.click();
                await verifyHiddenAndRevealedValue({
                    locator: dashboardPage.walletAtIndexFiatAmount(0),
                });
            });

            await test.step('Verify analytics event', () => {
                const menuToggleDiscreetEvent = analytics.findAnalyticsEventByType<
                    ExtractByEventType<(typeof events.menuToggleDiscreetEvent)['name']>
                >(events.menuToggleDiscreetEvent.name);
                expect(menuToggleDiscreetEvent.value).toBe('true');
            });
        },
    );
});
