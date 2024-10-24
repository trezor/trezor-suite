import http from 'http';
import { exec } from 'child_process';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import TrezorConnect from '@trezor/connect-mobile';
import { conditionalDescribe } from '@suite-common/test-utils';

import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
} from '../utils';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onCoinEnablingInit } from '../pageObjects/coinEnablingActions';
import { onHome } from '../pageObjects/homeActions';

const SERVER_PORT = 8080;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

let server: http.Server | undefined;

const openUriScheme = (url: string, platformToOpen: 'android') => {
    const command = `npx uri-scheme open '${url.replace(/'/g, '')}' --${platformToOpen}`;

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

conditionalDescribe(device.getPlatform() !== 'android', 'Deeplink connect popup.', () => {
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

        await prepareTrezorEmulator();
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();

        await onCoinEnablingInit.waitForScreen();
        await onCoinEnablingInit.enableNetwork('regtest');
        await onCoinEnablingInit.clickOnConfirmButton();

        await waitFor(element(by.id('skip-view-only-mode')))
            .toBeVisible()
            .withTimeout(10000); // communication between connected Trezor and app takes some time.

        await element(by.id('skip-view-only-mode')).tap();

        // This `TrezorConnect` instance here is pretending to be the integrator or @trezor/connect-mobile
        await TrezorConnect.init({
            manifest: {
                email: 'developer@xyz.com',
                appUrl: 'http://your.application.com',
            },
            deeplinkOpen: url => {
                openUriScheme(url, 'android');
            },
            deeplinkCallbackUrl: `${SERVER_URL}/connect/`,
            connectSrc: 'https://dev.suite.sldev.cz/connect/develop/',
        });
    });

    beforeEach(async () => {
        await restartApp();

        await device.reverseTcpPort(SERVER_PORT);

        await appIsFullyLoaded();

        await waitFor(element(by.id('@screen/ConnectingDevice')))
            .toBeVisible()
            .withTimeout(10000);

        await onHome.waitForScreen();
    });

    afterAll(async () => {
        disconnectTrezorUserEnv();
        await new Promise(resolve => {
            if (server) {
                server.close(() => {
                    resolve(null);
                });
            }
        });
        await device.terminateApp();
    });

    it('Handle deeplink', async () => {
        const promise = TrezorConnect.getAddress({
            path: "m/49'/0'/0'/0/0",
            coin: 'btc',
        });

        await element(by.id('@popup/deeplink-info'));

        await waitFor(element(by.id('@popup/call-device')))
            .toBeVisible()
            .withTimeout(10 * 1000);
        await element(by.id('@popup/call-device')).tap();

        await TrezorUserEnvLink.pressYes();

        const response = await promise;
        const expectedResponse = {
            id: 1,
            payload: {
                path: [49, 0, 0, 0, 0],
                serializedPath: 'm/49/0/0/0/0',
                address: '3J7UQSLAaFh1nkUomVdm8ArifPEvYfNr1o',
            },
            success: true,
        };

        if (JSON.stringify(response) !== JSON.stringify(expectedResponse)) {
            throw new Error('Result does not match expected.');
        }
    });
});
