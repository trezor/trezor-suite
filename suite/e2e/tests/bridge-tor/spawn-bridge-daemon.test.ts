import path from 'path';

import { TestStream } from '@trezor/e2e-utils';

import {
    expectBridgeToBeRunning,
    expectBridgeToBeStopped,
    waitForAppToBeInitialized,
} from '../../support/bridge';
import { skipFixture } from '../../support/common';
import { launchSuiteElectronApp } from '../../support/electron';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Bridge', { tag: ['@desktopOnly', '@T3W1', '@T3T1', '@windows'] }, () => {
    // The fixture app is closed right after launch, and its interrupted startup raises toasts.
    test.use({
        jsExceptionWatcher: skipFixture,
        toastErrorWatcher: skipFixture,
        startEmulator: false,
        setupEmulator: false,
    });

    test.beforeEach(async ({ trezorUserEnv, electronApp }) => {
        // The app must exit, not just close its window: a running app holds the single-instance lock.
        await electronApp!.close();
        // Ensure bridge is stopped so we properly test the electron app starting node-bridge module.
        await trezorUserEnv.connect();
        await trezorUserEnv.stopBridge();
    });

    test(
        'App in daemon mode spawns node-bridge and opens its UI for a second instance',
        { annotation: createTestAnnotation({ stream: TestStream.Connect }) },
        async ({ request }, testInfo) => {
            await expectBridgeToBeStopped(request);

            const daemonApp = await launchSuiteElectronApp({
                bridgeDaemon: 'without-ui',
                artefactFolder: testInfo.outputDir,
                viewport: testInfo.project.use.viewport!,
            });

            await expect(async () => {
                await expectBridgeToBeRunning(request);
            }).toPass({ timeout: 3_000 });

            const daemonWindow = daemonApp.waitForEvent('window');
            // Resetting user data would delete the daemon's single-instance lock on Linux.
            await expect(
                launchSuiteElectronApp({
                    keepUserData: true,
                    bridgeDaemon: 'with-ui',
                    artefactFolder: path.join(testInfo.outputDir, 'second-instance'),
                    viewport: testInfo.project.use.viewport!,
                }),
                'expect the second instance to quit because the daemon holds the single-instance lock',
            ).rejects.toThrow();

            const window = await daemonWindow;
            expect(await window.title()).toContain('Trezor Suite');
            await waitForAppToBeInitialized({ electronApp: daemonApp, window });

            await expectBridgeToBeRunning(request);
            await daemonApp.close();
            await expectBridgeToBeStopped(request);
        },
    );
});
