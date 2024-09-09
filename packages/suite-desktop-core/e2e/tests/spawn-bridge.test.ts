import { test as testPlaywright, expect as expectPlaywright } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { launchSuite, waitForDataTestSelector } from '../support/common';
import { onDashboardPage } from '../support/pageActions/dashboardActions';

testPlaywright.describe.serial('Bridge', () => {
    const expectedBridgeVersion = '2.0.33';

    // note: this test won't work locally on mac - you are likely to have tenv running occupying the bridge port
    testPlaywright(
        `App spawns bundled bridge version ${expectedBridgeVersion} and stops it after app quit`,
        async ({ request }) => {
            const isBridgeRunning = async (expected: boolean) => {
                try {
                    const response = await request.post('http://127.0.0.1:21325/', {
                        headers: {
                            Origin: 'https://wallet.trezor.io',
                        },
                    });

                    if (!expected) {
                        throw new Error('Bridge is running but it should not be.');
                    }

                    const json = await response.json();
                    const { version } = json;
                    expectPlaywright(version).toEqual(expectedBridgeVersion);
                } catch (error) {
                    if (error.message === 'Bridge is running but it should not be.') {
                        console.error('Caught specific error:', error.message);
                        throw error; // Rethrow if you want the test to fail.
                    } else if (expected) {
                        throw new Error('Bridge should be running, but it is not.');
                    }
                    // If the error is not one we care about, we can just log it since it is expected.
                    console.error('Caught expected error:', error.message);
                }
            };

            await TrezorUserEnvLink.stopBridge();
            const suite = await launchSuite({ startExternalBridge: false });
            await suite.window.title();

            await waitForDataTestSelector(suite.window, '@welcome/title');

            // bridge is running
            await isBridgeRunning(true);

            // bridge is running after renderer window is refreshed
            await suite.window.reload();
            await suite.window.title();
            await isBridgeRunning(true);

            // bridge is not running after app is closed
            await suite.electronApp.close();
            await isBridgeRunning(false);
        },
    );

    testPlaywright(
        'App acquired device, EXTERNAL bridge is restarted, app reconnects',
        async () => {
            await TrezorUserEnvLink.startEmu({ wipe: true, version: '2-latest', model: 'T2T1' });
            await TrezorUserEnvLink.setupEmu({});
            const suite = await launchSuite();
            await suite.window.title();
            await waitForDataTestSelector(suite.window, '@welcome/title');
            await onDashboardPage.passThroughInitialRun(suite.window);

            await TrezorUserEnvLink.stopBridge();

            await waitForDataTestSelector(suite.window, '@connect-device-prompt');

            await TrezorUserEnvLink.startBridge();
            await waitForDataTestSelector(suite.window, '@dashboard/index');
        },
    );

    // todo: add test case when INTERNAL bridge is killed and auto-restarted
});
