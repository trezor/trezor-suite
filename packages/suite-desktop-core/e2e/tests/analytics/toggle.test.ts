import { EventType } from '@trezor/suite-analytics';

import { expect, test } from '../../support/fixtures';

test.describe('Analytics Toggle - Enabling and Disabling', { tag: ['@group=other'] }, () => {
    test.beforeEach(async ({ analytics, onboardingPage }) => {
        await analytics.interceptAnalytics();
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('should respect disabled analytics in onboarding with following enabling in settings', async ({
        analytics,
        page,
        analyticsPage,
        onboardingPage,
        dashboardPage,
        settingsPage,
    }) => {
        // pass through onboarding with disabled analytics
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();
        await settingsPage.analyticsSwitch.click();
        await expect(settingsPage.analyticsSwitch.locator('input')).not.toBeChecked();

        await analyticsPage.continueButton.click(); // Click the button and trigger the request
        await expect.poll(() => analytics.requests).toHaveLength(1);

        // assert that only "analytics/dispose" event was fired
        const disposeRequest = analytics.requests[0];
        expect(disposeRequest).toHaveProperty('c_type', EventType.SettingsAnalytics);
        expect(disposeRequest).toHaveProperty('value', 'false');
        expect(disposeRequest).toHaveProperty('c_session_id');
        expect(disposeRequest).toHaveProperty('c_instance_id');
        expect(disposeRequest).toHaveProperty('c_timestamp');
        expect(disposeRequest.c_timestamp).toMatch(/^\d+$/);

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
        expect(analytics.requests).toHaveLength(1);

        // enable analytics and check "analytics/enable" event was fired
        await settingsPage.analyticsSwitch.click();
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();
        await expect.poll(() => analytics.requests).toHaveLength(2);

        const enableRequest = analytics.requests[1];
        expect(enableRequest).toHaveProperty('c_type', EventType.SettingsAnalytics);
        expect(enableRequest).toHaveProperty('c_session_id');
        expect(enableRequest).toHaveProperty('c_instance_id');
        expect(enableRequest).toHaveProperty('c_timestamp');
        expect(enableRequest.c_timestamp).toMatch(/^\d+$/);
        expect(analytics.requests).toHaveLength(2);

        // check that timestamps are different
        expect(disposeRequest.c_timestamp).not.toEqual(enableRequest.c_timestamp);

        // check that session ids changed after reload
        expect(disposeRequest.c_session_id).not.toEqual(enableRequest.c_session_id);

        // check that instance ids are the same after reload
        expect(disposeRequest.c_instance_id).toEqual(enableRequest.c_instance_id);

        // change fiat and check that it was logged
        await page.getByTestId('@settings/fiat-select/input').scrollIntoViewIfNeeded(); // Shouldn't be necessary, but without it the dropdown doesn't open
        await page.getByTestId('@settings/fiat-select/input').click();
        await page.getByTestId('@settings/fiat-select/option/huf').click();
        await expect.poll(() => analytics.requests).toHaveLength(3);
        expect(analytics.requests[2]).toHaveProperty('c_type', EventType.SettingsGeneralChangeFiat);
        expect(analytics.requests[2]).toHaveProperty('fiat', 'huf');
        expect(analytics.requests[2]).toHaveProperty(
            'c_instance_id',
            analytics.requests[1].c_instance_id,
        );
        expect(analytics.requests).toHaveLength(3);

        // open device modal and check that it was logged
        await dashboardPage.openDeviceSwitcher();
        await expect.poll(() => analytics.requests).toHaveLength(4);

        const deviceModalRequest = analytics.requests[3];
        expect(deviceModalRequest).toHaveProperty('c_type', EventType.RouterLocationChange);
        expect(analytics.requests).toHaveLength(4);
    });

    test('should respect enabled analytics in onboarding with following disabling in settings', async ({
        analytics,
        page,
        analyticsPage,
        onboardingPage,
        settingsPage,
    }) => {
        // pass through onboarding with enabled analytics
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();

        await analyticsPage.continueButton.click(); // Click the button and trigger the request
        await expect.poll(() => analytics.requests.length).toBeGreaterThan(2);

        // assert that more than 1 event was fired and it was "suite/ready" and "analytics/enable" for sure
        expect(analytics.requests.length).toBeGreaterThan(1);
        expect(analytics.extractRequestTypes()).toContain(EventType.SuiteReady);
        expect(analytics.extractRequestTypes()).toContain(EventType.SettingsAnalytics);

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
        await expect.poll(() => analytics.requests.length).toBeGreaterThan(3);
        expect(analytics.extractRequestTypes()).toContain(EventType.SettingsAnalytics);

        // check that "settings/general/change-fiat" event was not fired
        expect(analytics.extractRequestTypes()).not.toContain(EventType.SettingsGeneralChangeFiat);
    });
});
