import { events } from '@suite/analytics';

import { expect, test } from '../../support/fixtures';

test.describe(
    'Analytics Toggle - Enabling and Disabling',
    { tag: ['@T3W1', '@T3T1', '@smoke'] },
    () => {
        test.beforeEach(async ({ analytics, onboardingPage }) => {
            await analytics.interceptAnalytics();
            await onboardingPage.disableNecessaryFirmwareChecks();
            await onboardingPage.disableAuthenticityCheck();
        });

        test('should respect disabled analytics in onboarding with following enabling in settings', async ({
            analytics,
            page,
            device,
            analyticsSection,
            onboardingPage,
            dashboardPage,
            settingsPage,
            devicePrompt,
        }) => {
            await test.step('Disable analytics in onboarding', async () => {
                await expect(settingsPage.analyticsSwitchInput).toBeChecked();
                await settingsPage.analyticsSwitch.click();
                await expect(settingsPage.analyticsSwitchInput).not.toBeChecked();
            });

            const disposeRequest =
                await test.step('Continue onboarding and check analytics dispose event', async () => {
                    await analyticsSection.continueButton.click();
                    await analytics.waitForAnalyticsRequests();
                    // assert that only "analytics/dispose" event was fired
                    const request = analytics.findLatestRequestByLegacyType(
                        events.settingsAnalyticsEvent.name,
                    );
                    expect(request).toHaveProperty('c_type', events.settingsAnalyticsEvent.name);
                    expect(request).toHaveProperty('value', 'false');
                    expect(request).toHaveProperty('c_session_id');
                    expect(request).toHaveProperty('c_instance_id');
                    expect(request).toHaveProperty('c_timestamp');
                    expect(request?.c_timestamp).toMatch(/^\d+$/);

                    return request;
                });

            await test.step('Finish onboarding', async () => {
                if (device.hasTHP) {
                    await devicePrompt.allowConnectToTrezor();
                    await onboardingPage.enterTHPPairingCode();
                    await onboardingPage.enableAutoconnect();
                }

                await onboardingPage.confirmManualDeviceCheckButton.click();
            });

            await test.step('Reload app and check analytics state', async () => {
                // app needs time to save initialRun flag into storage to change session id
                await page.getByTestId('@suite/loading').waitFor({ state: 'hidden' });
                await page.discoveryShouldFinish();
                await page.reload();
                await settingsPage.navigateTo('application');
                await expect(settingsPage.analyticsSwitchInput).not.toBeChecked();
            });

            await test.step('Enable analytics in settings and check enable event', async () => {
                await settingsPage.analyticsSwitch.click();
                await expect(settingsPage.analyticsSwitchInput).toBeChecked();
                await analytics.waitForAnalyticsRequests();

                const enableRequest = analytics.findLatestRequestByLegacyType(
                    events.settingsAnalyticsEvent.name,
                );
                expect(enableRequest).toHaveProperty('c_type', events.settingsAnalyticsEvent.name);
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
            });

            await test.step('Change fiat and check analytics event', async () => {
                const enableRequest = analytics.findLatestRequestByLegacyType(
                    events.settingsAnalyticsEvent.name,
                );
                await settingsPage.changeFiatCurrency('huf');
                await analytics.waitForAnalyticsRequests();
                const changeFiatRequest = analytics.findLatestRequestByLegacyType(
                    events.settingsGeneralChangeFiatEvent.name,
                );
                expect(changeFiatRequest).toHaveProperty(
                    'c_type',
                    events.settingsGeneralChangeFiatEvent.name,
                );
                expect(changeFiatRequest).toHaveProperty('fiat', 'huf');
                expect(changeFiatRequest).toHaveProperty(
                    'c_instance_id',
                    enableRequest?.c_instance_id,
                );
            });

            await test.step('Open device modal and check analytics event', async () => {
                await dashboardPage.openDeviceSwitcher();
                await analytics.waitForAnalyticsRequests();

                const deviceModalRequest = analytics.findLatestRequestByType(
                    events.routerLocationChangeEvent.name,
                );
                expect(deviceModalRequest).toHaveProperty(
                    'c_type',
                    events.routerLocationChangeEvent.name,
                );
            });
        });

        test('should respect enabled analytics in onboarding with following disabling in settings', async ({
            device,
            analytics,
            analyticsSection,
            onboardingPage,
            settingsPage,
            devicePrompt,
        }) => {
            await test.step('Pass through onboarding with enabled analytics', async () => {
                await expect(settingsPage.analyticsSwitchInput).toBeChecked();
                await analyticsSection.continueButton.click();
                await analytics.waitForAnalyticsRequests(3);

                expect(analytics.requests.length).toBeGreaterThan(1);
                expect(
                    analytics.findLatestRequestByLegacyType(events.suiteReadyEvent.name),
                ).toBeDefined();
                expect(
                    analytics.findLatestRequestByLegacyType(events.settingsAnalyticsEvent.name),
                ).toBeDefined();
            });

            await test.step('Finish onboarding', async () => {
                if (device.hasTHP) {
                    await devicePrompt.allowConnectToTrezor();
                    await onboardingPage.enterTHPPairingCode();
                }
                await onboardingPage.confirmManualDeviceCheckButton.click();
            });

            await test.step('Go to settings and disable analytics', async () => {
                await settingsPage.navigateTo('application');
                await expect(settingsPage.analyticsSwitchInput).toBeChecked();

                await settingsPage.analyticsSwitch.click();
                await expect(settingsPage.analyticsSwitchInput).not.toBeChecked();
            });

            await test.step('Change fiat and check "settings/general/change-fiat" event was not fired', async () => {
                await settingsPage.changeFiatCurrency('huf');
                await analytics.waitForAnalyticsRequests();
                expect(
                    analytics.findLatestRequestByLegacyType(events.settingsAnalyticsEvent.name),
                ).toBeDefined();
                expect(
                    analytics.findLatestRequestByLegacyType(
                        events.settingsGeneralChangeFiatEvent.name,
                    ),
                ).not.toBeDefined();
            });
        });
    },
);
