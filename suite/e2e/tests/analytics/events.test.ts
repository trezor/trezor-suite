import { events } from '@suite/analytics';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { findLatestVersionForModel } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { Language, Theme } from '../../support/pageObjects/settings/settingsPage';
import { ExtractByEventType } from '../../support/types';

test.describe(
    'Analytics Events',
    { tag: ['@webOnly', '@specificFirmware', '@T3T1', '@smoke'] },
    () => {
        const firmwareVersion = findLatestVersionForModel(Model.T3T1); // Specific firmware is needed to have predictable firmware version in analytics and unfortunately I can't get the PW project defined device model here, so this test is limited to T3T1 only.
        test.use({ firmwareVersion });
        test.beforeEach(async ({ analytics, onboardingPage }) => {
            await analytics.interceptAnalytics();
            await onboardingPage.completeOnboarding();
        });

        test(
            'Analytics captures important events when started enabled by default',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Verify that analytics captures SuiteReady, DeviceConnect, TransportType, and DeviceDisconnect events when analytics is enabled by default',
                    category: TestCategory.General,
                    priority: TestPriority.High,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ device, analytics }) => {
                await analytics.waitForAnalyticsRequests(3);

                await test.step('Validate SuiteReady event', () => {
                    const suiteReadyEvent = analytics.findAnalyticsEventByType<
                        ExtractByEventType<(typeof events.suiteReadyEvent)['name']>
                    >(events.suiteReadyEvent.name);
                    expect(suiteReadyEvent).toMatchObject({
                        language: 'en-US',
                        enabledNetworks: '',
                        customBackends: '',
                        localCurrency: 'usd',
                        bitcoinUnit: 'BTC',
                        discreetMode: 'false',
                        screenWidth: '1280',
                        screenHeight: '720',
                        platformLanguages: 'en-US',
                        tor: 'false',
                        labeling: 'off',
                        rememberedStandardWallets: '0',
                        rememberedHiddenWallets: '0',
                        theme: 'light',
                        earlyAccessProgram: 'false',
                        experimentalFeatures: '',
                        autodetectLanguage: 'true',
                        autodetectTheme: 'true',
                        isAutomaticUpdateEnabled: 'false',
                    });
                });

                await test.step('Validate DeviceConnect event', () => {
                    const deviceConnectEvent = analytics.findAnalyticsEventByType<
                        ExtractByEventType<(typeof events.deviceConnectEvent)['name']>
                    >(events.deviceConnectEvent.name);
                    expect(deviceConnectEvent).toMatchObject({
                        mode: 'normal',
                        firmware: firmwareVersion,
                        bootloaderHash: '',
                        backup_type: 'Bip39',
                        pin_protection: 'false',
                        passphrase_protection: 'false',
                        totalInstances: '1',
                        isBitcoinOnly: 'false',
                        isBitcoinOnlyDevice: 'false',
                        totalDevices: '1',
                        language: 'en-US',
                        model: Model.T3T1,
                        optiga_sec: '0',
                    });
                });

                await test.step('Validate TransportType event', () => {
                    const transportTypeEvent = analytics.findAnalyticsEventByType<
                        ExtractByEventType<(typeof events.transportTypeEvent)['name']>
                    >(events.transportTypeEvent.name);
                    expect(transportTypeEvent.type).toBe('BridgeTransport');
                    expect(parseInt(transportTypeEvent.version, 10)).not.toBeNaN();
                });

                await test.step('Stop emulator and validate DeviceDisconnect event', async () => {
                    await device.powerOff();
                    await analytics.waitForAnalyticsRequests(1); // Poll to prevent race condition
                    expect(
                        analytics.findLatestRequestByLegacyType(events.deviceDisconnectEvent.name),
                    ).toBeDefined();
                });
            },
        );
    },
);

test.describe('Analytics Events', { tag: ['@webOnly', '@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({ startEmulator: false });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
        await onboardingPage.disableAuthenticityCheck();
    });

    test('Analytics capture suite-ready after getting enabled', async ({
        analytics,
        page,
        device,
        trezorUserEnv,
        analyticsSection,
        settingsPage,
        onboardingPage,
        devicePrompt,
    }) => {
        await test.step('Start suite with disabled analytics', async () => {
            await onboardingPage.optionallyDismissFwHashCheckError();
            await analyticsSection.toggleSwitch.click();
            await analyticsSection.continueButton.click();

            // Intercept analytic after we disable them, as if a user disables the analytics,
            // the only message about the analytics being sent is the "settings/analytics" disabled.
            await analytics.interceptAnalytics();

            await device.powerOn({ wipe: true });
            await device.setup({
                passphrase_protection: true,
            });

            await trezorUserEnv.startBridge();
            if (device.hasTHP) {
                await devicePrompt.allowConnectToTrezor();
                await onboardingPage.enterTHPPairingCode();
            }
        });

        await test.step('Change settings before enabling analytics', async () => {
            await settingsPage.navigateTo('coins');
            await settingsPage.coinsTab.enableNetwork('btc');
            await settingsPage.navigateTo('application');
            await settingsPage.changeLanguage(Language.Czech);
            await settingsPage.changeLanguage(Language.English);
            await settingsPage.changeFiatCurrency('czk');
            await settingsPage.changeBTCUnits('Satoshis');
            await settingsPage.changeTheme(Theme.Dark);
            await settingsPage.toggleTestnetNetworks();
            await settingsPage.navigateTo('coins');
            await settingsPage.coinsTab.enableNetwork('eth');
            await settingsPage.coinsTab.enableNetwork('thod');
            await settingsPage.coinsTab.disableNetwork('btc');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
            await settingsPage.coinsTab.changeBackend('blockbook', 'https://eth.marek.pl/');
            await settingsPage.closeSettings();
        });

        await test.step('Enable analytics and reload', async () => {
            expect(analytics.requests).toHaveLength(0);
            await settingsPage.navigateTo('application');
            await settingsPage.analyticsSwitch.click();
            await settingsPage.closeSettings();
            await page.reload();
            await onboardingPage.confirmManualDeviceCheckButton.click();
        });

        await test.step('Wait for analytics events and validate event types', async () => {
            await analytics.waitForAnalyticsRequests(4);
            expect(analytics.requests[0]).toHaveProperty(
                'c_type',
                events.settingsAnalyticsEvent.name,
            );
            expect(analytics.requests[1]).toHaveProperty(
                'c_type',
                events.routerLocationChangeEvent.name,
            );
            expect(analytics.requests[2]).toHaveProperty('c_type', events.suiteReadyEvent.name);
        });

        await test.step('Validate SettingsAnalytics event', () => {
            const settingsAnalyticsEvent = analytics.findAnalyticsEventByType<
                ExtractByEventType<(typeof events.settingsAnalyticsEvent)['name']>
            >(events.settingsAnalyticsEvent.name);
            expect(settingsAnalyticsEvent.value).toBe('true');
        });

        await test.step('Validate SuiteReady event reflects changed settings', () => {
            const suiteReadyEvent = analytics.findAnalyticsEventByType<
                ExtractByEventType<(typeof events.suiteReadyEvent)['name']>
            >(events.suiteReadyEvent.name);
            expect(suiteReadyEvent).toMatchObject({
                language: 'en-US',
                enabledNetworks: 'eth,thod',
                customBackends: 'eth',
                localCurrency: 'czk',
                bitcoinUnit: 'sat',
                discreetMode: 'false',
                screenWidth: '1280',
                screenHeight: '720',
                platformLanguages: 'en-US',
                tor: 'false',
                labeling: 'off',
                rememberedStandardWallets: '0',
                rememberedHiddenWallets: '0',
                theme: 'dark',
                earlyAccessProgram: 'false',
                experimentalFeatures: 'testnet-networks',
                autodetectLanguage: 'false',
                autodetectTheme: 'false',
                isAutomaticUpdateEnabled: 'false',
            });
            expect(parseInt(suiteReadyEvent.suiteVersion, 10)).not.toBeNaN();
            expect(parseInt(suiteReadyEvent.browserVersion, 10)).not.toBeNaN();
            expect(suiteReadyEvent.osName).toBeDefined();
            expect(parseInt(suiteReadyEvent.osVersion, 10)).not.toBeNaN();
            const viewport = page.viewportSize();
            expect(suiteReadyEvent.windowWidth).toBe(viewport?.width.toString());
            expect(suiteReadyEvent.windowHeight).toBe(viewport?.height.toString());
        });
    });
});
