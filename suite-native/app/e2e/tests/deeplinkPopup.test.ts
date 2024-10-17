import http from 'http';
import { exec } from 'child_process';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import TrezorConnect from '@trezor/connect-mobile';

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

    // TODO: make it asynchronous
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

const reverseServerPort = (port: number) => {
    return new Promise((resolve, reject) => {
        exec(
            `/usr/local/bin/platform-tools/adb reverse tcp:${port} tcp:${port}`,
            (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                console.info(stdout);
                console.error(stderr);
                resolve(stdout);
            },
        );
    });
};

describe('Deeplink connect popup.', () => {
    beforeAll(async () => {
        console.log('beforeAll');
        server = http.createServer((req, res) => {
            console.log('req', req);
            console.log('req.url', req.url);
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
            connectSrc: 'https://dev.suite.sldev.cz/connect/9.1.2/',
        });
    });

    beforeEach(async () => {
        console.log('beforeEach');
        await prepareTrezorEmulator();
        await restartApp();

        console.log('after restartApp');

        await reverseServerPort(SERVER_PORT);

        console.log('after reverse ports');
        await appIsFullyLoaded();
        console.log('after appIsFullyLoaded');

        await waitFor(element(by.id('@screen/ConnectingDevice')))
            .toBeVisible()
            .withTimeout(10000);

        await onHome.waitForScreen();
        console.log('after onHome.waitForScreen');
        // await onTabBar.navigateToMyAssets();
        // console.log('after onTabBar.navigateToMyAssets');

        // await onMyAssets.openAccountDetail({ accountName: 'Bitcoin Regtest #1' });
        // console.log('after onMyAssets.openAccountDetail');
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
        console.log('starting navigate to dashboard');
        // await onOnboarding.finishOnboarding();

        console.log('calling TrezorConnect');
        const promise = TrezorConnect.getAddress({
            path: "m/49'/0'/0'/0/0",
            coin: 'btc',
        });

        console.log('waiting for @popup/deeplink-info');
        await element(by.id('@popup/deeplink-info'));

        console.log('waiting for @popup/call-device');
        await waitFor(element(by.id('@popup/call-device')))
            .toBeVisible()
            .withTimeout(10 * 1000);
        console.log('tapping on @popup/call-device');
        await element(by.id('@popup/call-device')).tap();

        console.log('pressYes');
        await TrezorUserEnvLink.pressYes();

        const response = await promise;
        console.log('response', response);
        const expectedResponse = {
            id: 1,
            payload: {
                path: [49, 0, 0, 0, 0],
                serializedPath: 'm/49/0/0/0/0',
                address: '3J7UQSLAaFh1nkUomVdm8ArifPEvYfNr1o',
            },
            success: true,
        };

        await new Promise((resolve, reject) => {
            if (JSON.stringify(response) === JSON.stringify(expectedResponse)) {
                return resolve(null);
            }
            reject(new Error('Result does not match expected.'));
        });
    });
});
