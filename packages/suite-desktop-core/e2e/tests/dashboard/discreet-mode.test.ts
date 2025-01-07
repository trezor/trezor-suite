import { Locator } from '@playwright/test';

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType } from '@trezor/suite-web/e2e/support/types';

import { test, expect } from '../../support/fixtures';

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

test.describe('Discreet Mode', { tag: ['@group=suite'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ analytics, dashboardPage, onboardingPage }) => {
        await analytics.interceptAnalytics();
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Balances are hidden when user enables discreet mode', async ({
        analytics,
        assetsPage,
        dashboardPage,
        walletPage,
    }) => {
        await dashboardPage.hideBalanceButton.click();

        await test.step('Verify account value is hidden', async () => {
            await verifyHiddenAndRevealedValue({
                locator: walletPage.balanceOfAccount('btc'),
                hiddenValue: '###',
                revealedValue: '0',
            });
        });

        await test.step('Verify asset card value is hidden', async () => {
            await verifyHiddenAndRevealedValue({ locator: assetsPage.assetFiatAmount('btc') });
        });

        await test.step('Verify asset row value is hidden', async () => {
            await assetsPage.tableIcon.click();
            await verifyHiddenAndRevealedValue({ locator: assetsPage.assetFiatAmount('btc') });
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

        test.step('Verify analytics event', () => {
            const menuToggleDiscreetEvent = analytics.findAnalyticsEventByType<
                ExtractByEventType<EventType.MenuToggleDiscreet>
            >(EventType.MenuToggleDiscreet);
            expect(menuToggleDiscreetEvent.value).toBe('true');
        });
    });
});
