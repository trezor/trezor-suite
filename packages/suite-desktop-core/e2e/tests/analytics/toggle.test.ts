import { EventType } from '@trezor/suite-analytics';

import { expect, test } from '../../support/fixtures';

test.describe('Analytics Toggle - Enabling and Disabling', { tag: ['@group=other'] }, () => {
    test.beforeEach(async ({ analytics, onboardingPage }) => {
        await analytics.interceptAnalytics();
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test('should respect disabled analytics in onboarding with following enabling in settings', async ({
        analytics,
        page,
        analyticsSection,
        onboardingPage,
        dashboardPage,
        settingsPage,
    }) => {
        // pass through onboarding with disabled analytics
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();
        await settingsPage.analyticsSwitch.click();
        await expect(settingsPage.analyticsSwitch.locator('input')).not.toBeChecked();

        await analyticsSection.continueButton.click(); // Click the button and trigger the request
        await analytics.waitForAnalyticsRequests();

        // assert that only "analytics/dispose" event was fired
        const disposeRequest = analytics.findLatestRequestByType(EventType.SettingsAnalytics);
        expect(disposeRequest).toHaveProperty('c_type', EventType.SettingsAnalytics);
        expect(disposeRequest).toHaveProperty('value', 'false');
        expect(disposeRequest).toHaveProperty('c_session_id');
        expect(disposeRequest).toHaveProperty('c_instance_id');
        expect(disposeRequest).toHaveProperty('c_timestamp');
        expect(disposeRequest?.c_timestamp).toMatch(/^\d+$/);

        await page.getByTestId('@onboarding/exit-app-button').click();

        if (onboardingPage.isModelWithSecureElement()) {
            await onboardingPage.passThroughAuthenticityCheck();
        }

        await onboardingPage.onboardingViewOnlyEnableButton.click();
        await onboardingPage.viewOnlyTooltipGotItButton.click();

        // reload app (important, app needs time to save initialRun flag into storage) to change session id
        await page.getByTestId('@suite/loading').waitFor({ state: 'hidden' });
        await dashboardPage.discoveryShouldFinish();
        await page.reload();

        // go to settings, analytics should not enabled and no additional analytics requests should be fired
        await settingsPage.navigateTo('application');
        await expect(settingsPage.analyticsSwitch.locator('input')).not.toBeChecked();

        // enable analytics and check "analytics/enable" event was fired
        await settingsPage.analyticsSwitch.click();
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();
        await analytics.waitForAnalyticsRequests();

        const enableRequest = analytics.findLatestRequestByType(EventType.SettingsAnalytics);
        expect(enableRequest).toHaveProperty('c_type', EventType.SettingsAnalytics);
        expect(enableRequest).toHaveProperty('c_session_id');
        expect(enableRequest).toHaveProperty('c_instance_id');
        expect(enableRequest).toHaveProperty('c_timestamp');
        expect(enableRequest?.c_timestamp).toMatch(/^\d+$/);

        // check that timestamps are different
        expect(disposeRequest?.c_timestamp).not.toEqual(enableRequest?.c_timestamp);

        // check that session ids changed after reload
        expect(disposeRequest?.c_session_id).not.toEqual(enableRequest?.c_session_id);

        // check that instance ids are the same after reload
        expect(disposeRequest?.c_instance_id).toEqual(enableRequest?.c_instance_id);

        // change fiat and check that it was logged
        await page.getByTestId('@settings/fiat-select/input').scrollIntoViewIfNeeded(); // Shouldn't be necessary, but without it the dropdown doesn't open
        await page.getByTestId('@settings/fiat-select/input').click();
        await page.getByTestId('@settings/fiat-select/option/huf').click();

        await analytics.waitForAnalyticsRequests();
        const changeFiatRequest = analytics.findLatestRequestByType(
            EventType.SettingsGeneralChangeFiat,
        );
        expect(changeFiatRequest).toHaveProperty('c_type', EventType.SettingsGeneralChangeFiat);
        expect(changeFiatRequest).toHaveProperty('fiat', 'huf');
        expect(changeFiatRequest).toHaveProperty('c_instance_id', enableRequest?.c_instance_id);

        // open device modal and check that it was logged
        await dashboardPage.openDeviceSwitcher();
        await analytics.waitForAnalyticsRequests();

        const deviceModalRequest = analytics.findLatestRequestByType(
            EventType.RouterLocationChange,
        );
        expect(deviceModalRequest).toHaveProperty('c_type', EventType.RouterLocationChange);
    });

    test('should respect enabled analytics in onboarding with following disabling in settings', async ({
        analytics,
        page,
        analyticsSection,
        onboardingPage,
        settingsPage,
    }) => {
        // pass through onboarding with enabled analytics
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();

        await analyticsSection.continueButton.click(); // Click the button and trigger the request
        await analytics.waitForAnalyticsRequests(2);

        // assert that more than 1 event was fired and it was "suite/ready" and "analytics/enable" for sure
        expect(analytics.requests.length).toBeGreaterThan(1);
        expect(analytics.findLatestRequestByType(EventType.SuiteReady)).toBeDefined();
        expect(analytics.findLatestRequestByType(EventType.SettingsAnalytics)).toBeDefined();

        // finish onboarding
        await page.getByTestId('@onboarding/exit-app-button').click();
        if (onboardingPage.isModelWithSecureElement()) {
            await onboardingPage.passThroughAuthenticityCheck();
        }

        // go to settings, analytics should be enabled
        await settingsPage.navigateTo('application');
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();

        // disable analytics
        await settingsPage.analyticsSwitch.click();
        await expect(settingsPage.analyticsSwitch.locator('input')).not.toBeChecked();

        // change fiat and check that it was not logged
        await page.getByTestId('@settings/fiat-select/input').scrollIntoViewIfNeeded(); // Shouldn't be necessary, but without it the dropdown doesn't open
        await page.getByTestId('@settings/fiat-select/input').click();
        await page.getByTestId('@settings/fiat-select/option/huf').click();

        // check that analytics disable event was fired
        await analytics.waitForAnalyticsRequests();
        expect(analytics.findLatestRequestByType(EventType.SettingsAnalytics)).toBeDefined();

        // check that "settings/general/change-fiat" event was not fired
        expect(
            analytics.findLatestRequestByType(EventType.SettingsGeneralChangeFiat),
        ).not.toBeDefined();
    });
});
