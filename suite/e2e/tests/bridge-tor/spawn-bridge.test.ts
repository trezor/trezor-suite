import {
    BRIDGE_URL,
    BRIDGE_VERSION,
    expectBridgeToBeRunning,
    expectBridgeToBeStopped,
    waitForAppToBeInitialized,
} from '../../support/bridge';
import { skipFixture } from '../../support/common';
import { launchSuite } from '../../support/electron';
import { expect, test } from '../../support/fixtures';
import { AnalyticsSection } from '../../support/pageObjects/analyticsSection';
import { DevicePrompt } from '../../support/pageObjects/devicePrompt';
import { OnboardingPage } from '../../support/pageObjects/onboarding/onboardingPage';
import { SettingsPage } from '../../support/pageObjects/settings/settingsPage';
import { enhancePage } from '../../support/testExtends/enhancePage';

const NODE_BRIDGE_VERSION = '3.1.0';

test.use({ exceptionLogger: skipFixture });
test.describe('Bridge', { tag: ['@desktopOnly', '@T3W1', '@T3T1'] }, () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ trezorUserEnv }) => {
        //Ensure bridge is stopped so we properly test the electron app starting node-bridge module.
        await trezorUserEnv.connect();
        await trezorUserEnv.stopBridge();
    });

    test('App spawns bundled bridge and stops it after app quit', async ({ request }, testInfo) => {
        const suite = await launchSuite({
            bridgeDaemon: true,
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });
        const title = await suite.window.title();
        enhancePage(suite.window);
        expect(title).toContain('Trezor Suite');

        await waitForAppToBeInitialized(suite);
        await expectBridgeToBeRunning(request);

        const response = await request.post(BRIDGE_URL, {
            headers: {
                Origin: 'https://wallet.trezor.io',
            },
        });
        const json = await response.json();
        expect(json.version).toEqual(NODE_BRIDGE_VERSION);

        await test.step('Check bridge is running after renderer window is refreshed', async () => {
            await suite.window.reload();
            await suite.window.title();
            await expectBridgeToBeRunning(request);
        });

        await suite.electronApp.close();
        await expectBridgeToBeStopped(request);
    });

    test.use({ startEmulator: false, setupEmulator: false });
    test('App acquired device, EXTERNAL bridge is restarted, app reconnects', async ({
        device,
        trezorUserEnv,
    }, testInfo) => {
        await device.powerOn({ wipe: true });
        await device.setup({});
        await trezorUserEnv.startBridge(BRIDGE_VERSION);

        const suite = await launchSuite({
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });
        enhancePage(suite.window);
        await suite.window.title();

        const devicePrompt = new DevicePrompt(suite.window, device);

        const onboardingPage = new OnboardingPage(
            suite.window,
            device,
            devicePrompt,
            new AnalyticsSection(suite.window),
            new SettingsPage(suite.window, device),
        );
        await onboardingPage.completeOnboarding();

        await trezorUserEnv.stopBridge();
        await devicePrompt.connectDevicePromptIsShown();

        await trezorUserEnv.startBridge(BRIDGE_VERSION);
        await expect(suite.window.getByTestId('@dashboard/index')).toBeVisible();
    });
});
