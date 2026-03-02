import { expect as jestExpect } from '@jest/globals';
import { exec } from 'child_process';

import TrezorConnect from '@trezor/connect-mobile';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { deviceAutoEjectState } from '../fixtures/deviceAutoEjectState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { DeepLinkServer } from '../support/deepLinkServer';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const deepLinkServer = new DeepLinkServer();

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
    btcDiscoveryFinishedStateT3T1,
    deviceAutoEjectState,
);

describe('Deeplink connect popup. [@androidOnly @T3T1]', () => {
    beforeAll(async () => {
        await deepLinkServer.start();
        await device.reverseTcpPort(deepLinkServer.port);
    });

    beforeEach(async () => {
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
            deeplinkCallbackUrl: `${deepLinkServer.url}/connect/`,
            connectSrc: 'https://dev.suite.sldev.cz/connect/develop/',
        });
    });

    afterAll(async () => {
        await deepLinkServer.stop();
    });

    it('Handle deeplink', async () => {
        const promise = TrezorConnect.getAddress({
            path: "m/49'/0'/0'/0/0",
            coin: 'btc',
        });

        await waitForVisible(by.id('@popup/deeplink-info'));

        // Skip waiting for Reanimated animations.
        await device.disableSynchronization();

        const permissionButton = element(by.id('@popup/call-device'));
        await waitForVisible(permissionButton);
        await permissionButton.tap();

        const confirmButton = element(by.id('@popup/confirm-addresses'));
        await waitForVisible(confirmButton);
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
});
