import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType } from '@trezor/suite-web/e2e/support/types';

import { expect, test } from '../../support/fixtures';

test.describe('Analytics Events', { tag: ['@group=suite', '@webOnly'] }, () => {
    test.use({ startEmulator: false });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    //TODO: Fix instable test
    test.skip('reports transport-type, suite-ready and device-connect/device-disconnect events when analytics is initialized and enabled', async ({
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

        await trezorUserEnvLink.startEmu({ wipe: true, model: 'T3T1', version: '2.8.1' });
        await trezorUserEnvLink.setupEmu({
            passphrase_protection: true,
        });

        await trezorUserEnvLink.startBridge();

        // reload to activate bridge and start testing app with enabled analytics
        await page.reload();
        await analytics.interceptAnalytics();
        await onboardingPage.optionallyDismissFwHashCheckError();
        await page.getByTestId('@onboarding/exit-app-button').click();

        // suite-ready is logged 1st, just check that it is reported when app is initialized and enabled
        // device-connect is logged 2nd
        // transport-type is logged 3rd
        await analytics.waitForAnalyticsRequests(3);
        expect(analytics.requests[0]).toHaveProperty('c_type', EventType.SuiteReady);
        expect(analytics.requests[1]).toHaveProperty('c_type', EventType.DeviceConnect);
        expect(analytics.requests[2]).toHaveProperty('c_type', EventType.TransportType);

        const deviceConnectEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.DeviceConnect>
        >(EventType.DeviceConnect);
        expect(deviceConnectEvent.mode).toBe('normal'); // not in BL
        expect(deviceConnectEvent.firmware).toBe('2.8.1'); // 2.6.0 is hardcoded in startEmu to always match
        expect(deviceConnectEvent.firmwareRevision).toBe(
            // good to check because of phishing
            '632b9561559b7ab6824bb7eeac072874e07b7b82', // https://github.com/trezor/trezor-firmware/releases/tag/core%2Fv2.6.0
        );
        expect(deviceConnectEvent.bootloaderHash).toBe('');
        expect(deviceConnectEvent.backup_type).toBe('Bip39');
        expect(deviceConnectEvent.pin_protection).toBe('false');
        expect(deviceConnectEvent.passphrase_protection).toBe('true'); // set in startEmu
        expect(deviceConnectEvent.totalInstances).toBe('1');
        expect(deviceConnectEvent.isBitcoinOnly).toBe('false');
        expect(deviceConnectEvent.totalDevices).toBe('1');
        expect(deviceConnectEvent.language).toBe('en-US');
        expect(deviceConnectEvent.model).toBe('T3T1');

        const transportTypeEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.TransportType>
        >(EventType.TransportType);
        expect(transportTypeEvent.type).toBe('BridgeTransport');
        expect(parseInt(transportTypeEvent.version, 10)).not.toBeNaN();

        // device-disconnect is logged 4th
        await trezorUserEnvLink.stopEmu();

        await analytics.waitForAnalyticsRequests(1); // Poll to prevent race condition
        expect(analytics.findLatestRequestByType(EventType.DeviceDisconnect)).toBeDefined();
    });

    test('reports suite-ready after enabling analytics on app initial run', async ({
        analytics,
        page,
        analyticsPage,
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
        await analyticsPage.continueButton.click();
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
        expect(suiteReadyEvent.language).toBe('en');
        expect(suiteReadyEvent.enabledNetworks).toBe('btc');
        expect(suiteReadyEvent.customBackends).toBe('');
        expect(suiteReadyEvent.localCurrency).toBe('usd');
        expect(suiteReadyEvent.bitcoinUnit).toBe('BTC');
        expect(suiteReadyEvent.discreetMode).toBe('false');
        expect(suiteReadyEvent.screenWidth).toBeDefined();
        expect(suiteReadyEvent.screenHeight).toBeDefined();
        expect(suiteReadyEvent.platformLanguages).toBeDefined();
        expect(suiteReadyEvent.tor).toBe('false');
        expect(suiteReadyEvent.labeling).toBeDefined();
        expect(suiteReadyEvent.rememberedStandardWallets).toBe('0');
        expect(suiteReadyEvent.rememberedHiddenWallets).toBe('0');
        expect(suiteReadyEvent.theme).toBe('light');
        expect(parseInt(suiteReadyEvent.suiteVersion, 10)).not.toBeNaN();
        expect(suiteReadyEvent.earlyAccessProgram).toBe('false');
        expect(parseInt(suiteReadyEvent.browserVersion, 10)).not.toBeNaN();
        expect(suiteReadyEvent.osName).toBeDefined();
        expect(parseInt(suiteReadyEvent.osVersion, 10)).not.toBeNaN();
        const viewport = page.viewportSize();
        expect(suiteReadyEvent.windowWidth).toBe(viewport?.width.toString());
        expect(suiteReadyEvent.windowHeight).toBe(viewport?.height.toString());
        expect(suiteReadyEvent.autodetectLanguage).toBe('true');
        expect(suiteReadyEvent.autodetectTheme).toBe('true');
    });
});
