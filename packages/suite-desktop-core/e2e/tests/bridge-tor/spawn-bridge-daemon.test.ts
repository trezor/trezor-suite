import {
    expectBridgeToBeRunning,
    expectBridgeToBeStopped,
    waitForAppToBeInitialized,
} from '../../support/bridge';
import { skipFixture } from '../../support/common';
import { launchSuite, launchSuiteElectronApp } from '../../support/electron';
import { expect, test } from '../../support/fixtures';

test.use({ exceptionLogger: skipFixture });
test.describe.serial('Bridge', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    test.beforeAll(async ({ trezorUserEnvLink }) => {
        // Ensure bridge is stopped so we properly test the electron app starting node-bridge module.
        await trezorUserEnvLink.connect();
        await trezorUserEnvLink.stopBridge();
    });

    test('App in daemon mode spawns bridge', async ({ request }, testInfo) => {
        const daemonApp = await launchSuiteElectronApp({
            bridgeDaemon: true,
            bridgeLegacyTest: false,
            videoFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });

        await expect(async () => {
            await expectBridgeToBeRunning(request);
        }).toPass({ timeout: 3_000 });

        // launch UI
        const suite = await launchSuite({
            videoFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });
        const title = await suite.window.title();
        expect(title).toContain('Trezor Suite');

        await waitForAppToBeInitialized(suite);

        await expectBridgeToBeRunning(request);
        await suite.electronApp.close();
        await expectBridgeToBeRunning(request);
        await daemonApp.close();
        await expectBridgeToBeStopped(request);
    });
});
