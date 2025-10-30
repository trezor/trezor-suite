import { expect as jestExpect } from '@jest/globals';
import { exec } from 'child_process';
import http from 'http';

import { conditionalDescribe } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect-mobile';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { btcDiscoveryFinishedStateT3W1 } from '../fixtures/btcDiscoveryFinishedStateT3W1';
import { deviceAutoEjectState } from '../fixtures/deviceAutoEjectState';
import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import {
    getModelFromEnv,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
} from '../support/setup';
import { appIsFullyLoaded } from '../support/utils';

const SERVER_PORT = 8080;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

let server: http.Server | undefined;

const openUriScheme = (url: string, platformToOpen: 'android') => {
    const command = `npx uri-scheme open '${url.replace(/'/g, '%27')}' --${platformToOpen} --raw`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(err);

            return;
        }
        // eslint-disable-next-line no-console
        console.info(stdout);
        console.error(stderr);
    });
};

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === 'T3W1' ? btcDiscoveryFinishedStateT3W1 : btcDiscoveryFinishedStateT3T1,
    getModelFromEnv() === 'T3W1' ? deviceChecksDisabledState : deviceChecksEnabledState, // skip device checks on T3W1 because we are using 2-main FW
    deviceAutoEjectState,
);

conditionalDescribe(
    device.getPlatform() === 'android',
    'Deeplink connect popup. [@fixT3W1]',
    () => {
        beforeAll(async () => {
            await new Promise(resolve => {
                server = http.createServer((req, res) => {
                    if (req.url) {
                        const url = new URL(req.url, SERVER_URL);
                        TrezorConnect.handleDeeplink(url.href);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('Callback URL received successfully!\n');
                    }
                });

                server.listen(SERVER_PORT, 'localhost', () => {
                    // eslint-disable-next-line no-console
                    console.info(`Server running at ${SERVER_URL}`);
                    resolve(null);
                });
            });
            await device.reverseTcpPort(SERVER_PORT);

            await openApp({ args: { preloadedState } });
            await prepareTrezorEmulator();

            // This `TrezorConnect` instance here is pretending to be the integrator or @trezor/connect-mobile
            await TrezorConnect.init({
                manifest: {
                    email: 'developer@xyz.com',
                    appName: 'Trezor Connect Tests',
                    appUrl: 'http://your.application.com',
                },
                deeplinkOpen: url => {
                    openUriScheme(url, 'android');
                },
                deeplinkCallbackUrl: `${SERVER_URL}/connect/`,
                connectSrc: 'https://dev.suite.sldev.cz/connect/develop/',
            });
            await appIsFullyLoaded();
        });

        afterAll(async () => {
            await new Promise(resolve => {
                if (server) {
                    server.close(() => {
                        resolve(null);
                    });
                }
            });
        });

        it('Handle deeplink', async () => {
            const promise = TrezorConnect.getAddress({
                path: "m/49'/0'/0'/0/0",
                coin: 'btc',
            });

            await element(by.id('@popup/deeplink-info'));

            // Skip waiting for Reanimated animations.
            await device.disableSynchronization();

            const permissionButton = element(by.id('@popup/call-device'));
            await waitFor(permissionButton).toBeVisible().withTimeout(30000);
            await permissionButton.tap();

            const confirmButton = element(by.id('@popup/confirm-addresses'));
            await waitFor(confirmButton).toBeVisible().withTimeout(10000);
            await confirmButton.tap();

            await device.enableSynchronization();
            await TrezorUserEnvLink.pressYes();

            const response = await promise;

            jestExpect(response).toEqual({
                success: true,
                id: jestExpect.any(Number),
                payload: jestExpect.objectContaining({
                    path: [2147483697, 2147483648, 2147483648, 0, 0],
                    serializedPath: "m/49'/0'/0'/0/0",
                    address: jestExpect.any(String),
                }),
            });
        });
    },
);
