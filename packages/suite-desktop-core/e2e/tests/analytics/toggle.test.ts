import { Request } from '@playwright/test';

import { EventType } from '@trezor/suite-analytics';

import { expect, test } from '../../support/fixtures';

async function getRequestParameters(requestPromise: Promise<Request>) {
    const request = await requestPromise;
    const url = new URL(request.url());
    const params = Object.fromEntries(url.searchParams.entries());

    return params;
}

const analyticsUrlPattern = '**/suite/log/**';

test.describe('Analytics Toggle - Enabling and Disabling', { tag: ['@group=other'] }, () => {
    test.beforeEach(async ({ analytics, onboardingPage }) => {
        analytics.interceptAnalytics();
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

        const disposeRequestPromise = page.waitForRequest(analyticsUrlPattern); // Prepare waiting for the request
        await analyticsPage.continueButton.click(); // Click the button and trigger the request

        // assert that only "analytics/dispose" event was fired
        const paramsDispose = await getRequestParameters(disposeRequestPromise);
        expect(paramsDispose).toHaveProperty('c_type', EventType.SettingsAnalytics);
        expect(paramsDispose).toHaveProperty('value', 'false');
        expect(paramsDispose).toHaveProperty('c_session_id');
        expect(paramsDispose).toHaveProperty('c_instance_id');
        expect(paramsDispose).toHaveProperty('c_timestamp');
        expect(paramsDispose.c_timestamp).toMatch(/^\d+$/);
        expect(analytics.requests.length).toBe(1);

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
        const enableRequestPromise = page.waitForRequest(analyticsUrlPattern); // Prepare waiting for the request
        await settingsPage.analyticsSwitch.click();
        await expect(settingsPage.analyticsSwitch.locator('input')).toBeChecked();

        const paramsEnable = await getRequestParameters(enableRequestPromise);
        expect(paramsEnable).toHaveProperty('c_type', EventType.SettingsAnalytics);
        expect(paramsEnable).toHaveProperty('c_session_id');
        expect(paramsEnable).toHaveProperty('c_instance_id');
        expect(paramsEnable).toHaveProperty('c_timestamp');
        expect(paramsEnable.c_timestamp).toMatch(/^\d+$/);
        expect(analytics.requests).toHaveLength(2);

        // check that timestamps are different
        expect(paramsDispose.c_timestamp).not.toEqual(paramsEnable.c_timestamp);

        // check that session ids changed after reload
        expect(paramsDispose.c_session_id).not.toEqual(paramsEnable.c_session_id);

        // check that instance ids are the same after reload
        expect(paramsDispose.c_instance_id).toEqual(paramsEnable.c_instance_id);

        // change fiat and check that it was logged
        const changeFiatRequestPromise = page.waitForRequest(analyticsUrlPattern); // Prepare waiting for the request
        await page.getByTestId('@settings/fiat-select/input').scrollIntoViewIfNeeded(); // Shouldn't be necessary, but without it the dropdown doesn't open
        await page.getByTestId('@settings/fiat-select/input').click();
        await page.getByTestId('@settings/fiat-select/option/huf').click();
        const paramsChangeFiat = await getRequestParameters(changeFiatRequestPromise);
        expect(paramsChangeFiat).toHaveProperty('c_type', EventType.SettingsGeneralChangeFiat);
        expect(paramsChangeFiat).toHaveProperty('fiat', 'huf');
        expect(paramsChangeFiat).toHaveProperty('c_instance_id', paramsEnable.c_instance_id);
        expect(analytics.requests).toHaveLength(3);

        // open device modal and check that it was logged
        const deviceModalRequestPromise = page.waitForRequest(analyticsUrlPattern); // Prepare waiting for the request
        await dashboardPage.openDeviceSwitcher();
        const paramsDeviceModal = await getRequestParameters(deviceModalRequestPromise);
        expect(paramsDeviceModal).toHaveProperty('c_type', EventType.RouterLocationChange);
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

        const onboardingRequestPromise = page.waitForRequest(analyticsUrlPattern); // Prepare waiting for the request
        await analyticsPage.continueButton.click(); // Click the button and trigger the request

        // assert that more than 1 event was fired and it was "suite/ready" and "analytics/enable" for sure
        await onboardingRequestPromise;
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
        const disableAnalyticsRequestPromise = page.waitForRequest(analyticsUrlPattern); // Prepare waiting for the request
        await settingsPage.analyticsSwitch.click();
        await expect(settingsPage.analyticsSwitch.locator('input')).not.toBeChecked();

        // change fiat and check that it was logged
        await page.getByTestId('@settings/fiat-select/input').scrollIntoViewIfNeeded(); // Shouldn't be necessary, but without it the dropdown doesn't open
        await page.getByTestId('@settings/fiat-select/input').click();
        await page.getByTestId('@settings/fiat-select/option/huf').click();

        await disableAnalyticsRequestPromise;
        // check that analytics disable event was fired
        const paramsDisable = await getRequestParameters(disableAnalyticsRequestPromise);
        expect(paramsDisable).toHaveProperty('c_type', EventType.SettingsAnalytics);

        // check that "settings/general/change-fiat" event was not fired
        expect(analytics.extractRequestTypes()).not.toContain(EventType.SettingsGeneralChangeFiat);
    });
});
