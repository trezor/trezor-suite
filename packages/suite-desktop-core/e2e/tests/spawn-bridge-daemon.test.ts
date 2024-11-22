import { test, expect } from '../support/fixtures';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { createTimeoutPromise } from '@trezor/utils';
import { launchSuite, launchSuiteElectronApp, waitForDataTestSelector } from '../support/common';

test.describe.serial('Bridge', () => {
    test.beforeAll(async () => {
        // We make sure that bridge from trezor-user-env is stopped.
        // So we properly test the electron app starting node-bridge module.
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.stopBridge();
    });

    test('App in daemon mode spawns bridge', async ({ request }) => {
        const daemonApp = await launchSuiteElectronApp({
            bridgeDaemon: true,
            bridgeLegacyTest: false,
        });

        // 3s timeout for bridge to start
        await createTimeoutPromise(3000);

        // bridge is running
        const bridgeRes1 = await request.get('http://127.0.0.1:21325/status/');
        await expect(bridgeRes1).toBeOK();

        // launch UI
        const suite = await launchSuite();
        const title = await suite.window.title();
        expect(title).toContain('Trezor Suite');

        // We wait for `@welcome/title` or `@dashboard/graph` since
        // one or the other will be display depending on the state of the app
        // due to previously run tests. And both means the same for the porpoise of this test.
        // Bridge should be ready to check `/status` endpoint.
        await Promise.race([
            waitForDataTestSelector(suite.window, '@welcome/title'),
            waitForDataTestSelector(suite.window, '@dashboard/graph'),
        ]);

        // bridge is still running
        const bridgeRes2 = await request.get('http://127.0.0.1:21325/status/');
        await expect(bridgeRes2).toBeOK();

        await suite.electronApp.close();

        // bridge is still running
        const bridgeRes3 = await request.get('http://127.0.0.1:21325/status/');
        await expect(bridgeRes3).toBeOK();

        await daemonApp.close();

        // bridge is not running
        try {
            await request.get('http://127.0.0.1:21325/status/');
            throw new Error('should have thrown!');
        } catch {
            // ok
        }
    });
});
