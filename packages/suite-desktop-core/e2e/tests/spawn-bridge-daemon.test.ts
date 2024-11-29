import { test, expect } from '../support/fixtures';
import { launchSuite, launchSuiteElectronApp } from '../support/common';
import {
    expectBridgeToBeRunning,
    expectBridgeToBeStopped,
    waitForAppToBeInitialized,
} from '../support/bridge';

test.describe.serial('Bridge', () => {
    test.beforeAll(async ({ trezorUserEnvLink }) => {
        // Ensure bridge is stopped so we properly test the electron app starting node-bridge module.
        await trezorUserEnvLink.connect();
        await trezorUserEnvLink.stopBridge();
    });

    test('App in daemon mode spawns bridge', async ({ request }) => {
        const daemonApp = await launchSuiteElectronApp({
            bridgeDaemon: true,
            bridgeLegacyTest: false,
        });

        await expect(async () => {
            await expectBridgeToBeRunning(request);
        }).toPass({ timeout: 3_000 });

        // launch UI
        const suite = await launchSuite();
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
