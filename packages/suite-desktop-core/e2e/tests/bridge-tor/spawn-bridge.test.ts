import { test, expect } from '../../support/fixtures';
import { launchSuite, LEGACY_BRIDGE_VERSION } from '../../support/common';
import { OnboardingActions } from '../../support/pageActions/onboarding/onboardingActions';
import {
    BRIDGE_URL,
    expectBridgeToBeRunning,
    expectBridgeToBeStopped,
    waitForAppToBeInitialized,
} from '../../support/bridge';
import { AnalyticsActions } from '../../support/pageActions/analyticsActions';
import { DevicePromptActions } from '../../support/pageActions/devicePromptActions';

test.describe.serial('Bridge', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    test.beforeEach(async ({ trezorUserEnvLink }) => {
        //Ensure bridge is stopped so we properly test the electron app starting node-bridge module.
        await trezorUserEnvLink.connect();
        await trezorUserEnvLink.stopBridge();
    });

    // #15646 This test is failing and has no values since the launchSuite starts legacy bridge in emulator anyway
    test.skip('App spawns bundled bridge and stops it after app quit', async ({ request }) => {
        const suite = await launchSuite();
        const title = await suite.window.title();
        expect(title).toContain('Trezor Suite');

        await waitForAppToBeInitialized(suite);
        await expectBridgeToBeRunning(request);

        const response = await request.post(BRIDGE_URL, {
            headers: {
                Origin: 'https://wallet.trezor.io',
            },
        });
        const json = await response.json();
        expect(json.version).toEqual(LEGACY_BRIDGE_VERSION);

        await test.step('Check bridge is running after renderer window is refreshed', async () => {
            await suite.window.reload();
            await suite.window.title();
            await expectBridgeToBeRunning(request);
        });

        await suite.electronApp.close();
        await expectBridgeToBeStopped(request);
    });

    test('App acquired device, EXTERNAL bridge is restarted, app reconnects', async ({
        trezorUserEnvLink,
    }, testInfo) => {
        await trezorUserEnvLink.startEmu({ wipe: true, version: '2-latest', model: 'T2T1' });
        await trezorUserEnvLink.setupEmu({});
        await trezorUserEnvLink.startBridge(LEGACY_BRIDGE_VERSION);

        const suite = await launchSuite();
        await suite.window.title();

        const devicePrompt = new DevicePromptActions(suite.window);

        const onboardingPage = new OnboardingActions(
            suite.window,
            new AnalyticsActions(suite.window),
            devicePrompt,
            trezorUserEnvLink.defaultModel,
            testInfo,
        );
        await onboardingPage.completeOnboarding();

        await trezorUserEnvLink.stopBridge();
        await devicePrompt.connectDevicePromptIsShown();

        await trezorUserEnvLink.startBridge(LEGACY_BRIDGE_VERSION);
        await expect(suite.window.getByTestId('@dashboard/index')).toBeVisible();
    });
});
