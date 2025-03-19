import { EventType } from '@trezor/suite-analytics';

import { findLatestVersionForModel } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { ExtractByEventType } from '../../support/types';

test.describe('Analytics Events', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.use({ startEmulator: false });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test('reports transport-type, suite-ready and device-connect/device-disconnect events when analytics is initialized and enabled', async ({
        page,
        analytics,
        onboardingPage,
        settingsPage,
        trezorUserEnvLink,
    }) => {
        // go to settings and enable analytics (makes analytics enabled and initialized)
        await settingsPage.navigateTo('application');
        await settingsPage.analyticsSwitch.click();
        await settingsPage.closeSettings();

        const firmwareVersion = findLatestVersionForModel('T3T1');
        await trezorUserEnvLink.startEmu({ wipe: true, model: 'T3T1', version: firmwareVersion });
        await trezorUserEnvLink.setupEmu({
            passphrase_protection: true,
        });

        // reload to activate bridge and start testing app with enabled analytics
        await trezorUserEnvLink.startBridge();
        await page.waitForTimeout(2_000);
        await page.reload();

        await analytics.interceptAnalytics();
        await onboardingPage.optionallyDismissFwHashCheckError();
        await page.getByTestId('@onboarding/exit-app-button').click();

        // 1 SuiteReady, 2 DeviceConnect, 3 TransportType
        await analytics.waitForAnalyticsRequests(3);
        const suiteReadyEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.SuiteReady>
        >(EventType.SuiteReady);
        expect(suiteReadyEvent).toContainSubObject({
            language: 'en',
            enabledNetworks: 'btc',
            customBackends: '',
            localCurrency: 'usd',
            bitcoinUnit: 'BTC',
            discreetMode: 'false',
            screenWidth: '1280',
            screenHeight: '720',
            platformLanguages: 'en-US',
            tor: 'false',
            labeling: '',
            rememberedStandardWallets: '0',
            rememberedHiddenWallets: '0',
            theme: 'light',
            earlyAccessProgram: 'false',
            experimentalFeatures: '',
            autodetectLanguage: 'true',
            autodetectTheme: 'true',
            isAutomaticUpdateEnabled: 'false',
        });

        const deviceConnectEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.DeviceConnect>
        >(EventType.DeviceConnect);
        expect(deviceConnectEvent).toContainSubObject({
            mode: 'normal',
            firmware: firmwareVersion,
            bootloaderHash: '',
            backup_type: 'Bip39',
            pin_protection: 'false',
            passphrase_protection: 'true',
            totalInstances: '1',
            isBitcoinOnly: 'false',
            totalDevices: '1',
            language: 'en-US',
            model: 'T3T1',
            optiga_sec: '0',
        });

        const transportTypeEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.TransportType>
        >(EventType.TransportType);
        expect(transportTypeEvent.type).toBe('BridgeTransport');
        expect(parseInt(transportTypeEvent.version, 10)).not.toBeNaN();

        await trezorUserEnvLink.stopEmu();

        // device-disconnect is logged 4th
        await analytics.waitForAnalyticsRequests(1); // Poll to prevent race condition
        expect(analytics.findLatestRequestByType(EventType.DeviceDisconnect)).toBeDefined();
    });

    test('reports suite-ready after enabling analytics on app initial run', async ({
        analytics,
        page,
        analyticsSection,
        settingsPage,
        onboardingPage,
        trezorUserEnvLink,
    }) => {
        await trezorUserEnvLink.startEmu({ wipe: true, model: 'T3T1' });
        await trezorUserEnvLink.setupEmu({
            passphrase_protection: true,
        });

        await trezorUserEnvLink.startBridge();

        await analytics.interceptAnalytics();

        await settingsPage.navigateTo('application');

        // change language
        await page.getByTestId('@settings/language-select/input').scrollIntoViewIfNeeded();
        await page.getByTestId('@settings/language-select/input').click();
        await page.getByTestId('@settings/language-select/option/cs').click();

        // change fiat
        await page.getByTestId('@settings/fiat-select/input').scrollIntoViewIfNeeded();
        await page.getByTestId('@settings/fiat-select/input').click();
        await page.getByTestId('@settings/fiat-select/option/czk').click();

        // change BTC units
        await page.getByTestId('@settings/btc-units-select/input').scrollIntoViewIfNeeded();
        await page.getByTestId('@settings/btc-units-select/input').click();
        await page.getByTestId('@settings/btc-units-select/option/Satoshis').click();

        // change dark mode
        await page.getByTestId('@theme/color-scheme-select/input').scrollIntoViewIfNeeded();
        await page.getByTestId('@theme/color-scheme-select/input').click();
        await page.getByTestId('@theme/color-scheme-select/option/dark').click();

        // disable btc, enable ethereum and holesky
        await page.getByTestId('@settings/menu/wallet').click();
        await page.getByTestId('@settings/wallet/network/btc').click();
        await page.getByTestId('@settings/wallet/network/eth').click();
        await page.getByTestId('@settings/wallet/network/thol').click();

        // custom eth backend
        await page.getByTestId('@settings/wallet/network/eth/advance').click();
        await page.getByTestId('@settings/advance/select-type/input').click();
        await page.getByTestId('@settings/advance/select-type/option/blockbook').click();
        await page.getByTestId('@settings/advance/url').fill('https://eth.marek.pl/');
        await page.getByTestId('@settings/advance/button/save').click();

        await settingsPage.closeSettings();
        await onboardingPage.optionallyDismissFwHashCheckError();

        expect(analytics.requests).toHaveLength(0);
        await analyticsSection.continueButton.click();
        await page.getByTestId('@onboarding/exit-app-button').click();

        await analytics.waitForAnalyticsRequests(2);
        expect(analytics.requests[0]).toHaveProperty('c_type', EventType.SettingsAnalytics);
        expect(analytics.requests[1]).toHaveProperty('c_type', EventType.SuiteReady);

        // settings/analytics
        const settingsAnalyticsEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.SettingsAnalytics>
        >(EventType.SettingsAnalytics);
        expect(settingsAnalyticsEvent.value).toBe('true');

        // suite-ready reflects state when app was launched, does not include changes
        const suiteReadyEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.SuiteReady>
        >(EventType.SuiteReady);
        expect(suiteReadyEvent).toContainSubObject({
            language: 'en',
            enabledNetworks: 'btc',
            customBackends: '',
            localCurrency: 'usd',
            bitcoinUnit: 'BTC',
            discreetMode: 'false',
            screenWidth: '1280',
            screenHeight: '720',
            platformLanguages: 'en-US',
            tor: 'false',
            labeling: '',
            rememberedStandardWallets: '0',
            rememberedHiddenWallets: '0',
            theme: 'light',
            earlyAccessProgram: 'false',
            experimentalFeatures: '',
            autodetectLanguage: 'true',
            autodetectTheme: 'true',
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
