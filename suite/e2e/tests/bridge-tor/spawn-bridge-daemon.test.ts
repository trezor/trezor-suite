import {
    expectBridgeToBeRunning,
    expectBridgeToBeStopped,
    waitForAppToBeInitialized,
} from '../../support/bridge';
import { skipFixture } from '../../support/common';
import { launchSuite, launchSuiteElectronApp } from '../../support/electron';
import { expect, test } from '../../support/fixtures';

test.use({ exceptionLogger: skipFixture });
test.use({ context: undefined }); // disable default context fixture to be able to use beforeAll
test.describe('Bridge', { tag: ['@desktopOnly', '@T3W1', '@T3T1'] }, () => {
    test.describe.configure({ mode: 'serial' });
    test.beforeAll(async ({ trezorUserEnvLink, onboardingPage }) => {
        // Ensure bridge is stopped so we properly test the electron app starting node-bridge module.
        await trezorUserEnvLink.connect();
        await trezorUserEnvLink.stopBridge();
        await onboardingPage.verifySuiteIsLoaded();
    });

    test('App in daemon mode spawns node-bridge', async ({ request }, testInfo) => {
        await expectBridgeToBeStopped(request);

        const daemonApp = await launchSuiteElectronApp({
            bridgeDaemon: true,
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });

        await expect(async () => {
            await expectBridgeToBeRunning(request);
        }).toPass({ timeout: 3_000 });

        // launch UI, with node-bridge already running in background
        const suite = await launchSuite({
            artefactFolder: testInfo.outputDir,
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
