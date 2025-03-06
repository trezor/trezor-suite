import { exec } from 'child_process';
import http from 'http';

import { conditionalDescribe } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect-mobile';
import { MNEMONICS, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onConnectingDevice } from '../pageObjects/connectingDevice';
import { onHome } from '../pageObjects/homeActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
} from '../utils';

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

conditionalDescribe(device.getPlatform() === 'android', 'Deeplink connect popup.', () => {
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
        await onOnboarding.skipOnboarding();

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.toggleNetwork('regtest');
        await onCoinEnabling.clickOnConfirmButton();

        await onAlertSheet.skipViewOnlyMode();

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
        await prepareTrezorEmulator(MNEMONICS.mnemonic_12);
        await restartApp();

        await device.reverseTcpPort(SERVER_PORT);

        await appIsFullyLoaded();

        await onConnectingDevice.waitForScreen();
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
            .withTimeout(30000);
        await element(by.id('@popup/call-device')).tap();

        await TrezorUserEnvLink.pressYes();

        const response = await promise;
        const expectedResponse = {
            id: 1,
            payload: {
                path: [2147483697, 2147483648, 2147483648, 0, 0],
                serializedPath: "m/49'/0'/0'/0/0",
                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
            success: true,
        };

        if (JSON.stringify(response) !== JSON.stringify(expectedResponse)) {
            console.error('Received:', response);
            throw new Error('Result does not match expected.');
        }
    });
});
