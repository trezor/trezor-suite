import {
    BRIDGE_URL,
    expectBridgeToBeRunning,
    expectBridgeToBeStopped,
    waitForAppToBeInitialized,
} from '../../support/bridge';
import { skipFixture } from '../../support/common';
import { LEGACY_BRIDGE_VERSION, launchSuite } from '../../support/electron';
import { expect, test } from '../../support/fixtures';
import { AnalyticsSection } from '../../support/pageObjects/analyticsSection';
import { DevicePrompt } from '../../support/pageObjects/devicePrompt';
import { OnboardingPage } from '../../support/pageObjects/onboarding/onboardingPage';

test.use({ exceptionLogger: skipFixture });
test.describe.serial('Bridge', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    test.beforeEach(async ({ trezorUserEnvLink }) => {
        //Ensure bridge is stopped so we properly test the electron app starting node-bridge module.
        await trezorUserEnvLink.connect();
        await trezorUserEnvLink.stopBridge();
    });

    // #15646 This test is failing and has no values since the launchSuite starts legacy bridge in emulator anyway
    test.skip('App spawns bundled bridge and stops it after app quit', async ({
        request,
    }, testInfo) => {
        const suite = await launchSuite({
            videoFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });
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
        await trezorUserEnvLink.startEmu({ wipe: true, model: 'T2T1' });
        await trezorUserEnvLink.setupEmu({});
        await trezorUserEnvLink.startBridge(LEGACY_BRIDGE_VERSION);

        const suite = await launchSuite({
            videoFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });
        await suite.window.title();

        const devicePrompt = new DevicePrompt(suite.window);

        const onboardingPage = new OnboardingPage(
            suite.window,
            trezorUserEnvLink.defaultModel,
            testInfo,
            devicePrompt,
            new AnalyticsSection(suite.window),
        );
        await onboardingPage.completeOnboarding();

        await trezorUserEnvLink.stopBridge();
        await devicePrompt.connectDevicePromptIsShown();

        await trezorUserEnvLink.startBridge(LEGACY_BRIDGE_VERSION);
        await expect(suite.window.getByTestId('@dashboard/index')).toBeVisible();
    });
});
