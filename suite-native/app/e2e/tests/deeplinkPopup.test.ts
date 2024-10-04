import http from 'http';
import { exec } from 'child_process';
// `expect` keyword is already used by jest.
import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink, MNEMONICS } from '@trezor/trezor-user-env-link';
import TrezorConnect from '@trezor/connect-mobile';

import { openApp } from '../utils';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onCoinEnablingInit } from '../pageObjects/coinEnablingActions';

const TREZOR_DEVICE_LABEL = 'Trezor T - Tester';
const platform = device.getPlatform();
const SERVER_PORT = 8080;
const SERVER_URL = `http://10.0.2.2:${SERVER_PORT}`;

let server: http.Server | undefined;

function openUriScheme(url: string, platformToOpen: 'android') {
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
}

describe('Deeplink connect popup.', () => {
    beforeAll(async () => {
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
        });

        if (platform === 'android') {
            // Prepare Trezor device for test scenario and turn it off.
            await TrezorUserEnvLink.disconnect();
            await TrezorUserEnvLink.connect();
            await TrezorUserEnvLink.startEmu({ wipe: true });
            await TrezorUserEnvLink.setupEmu({
                label: TREZOR_DEVICE_LABEL,
                mnemonic: MNEMONICS.mnemonic_immune,
            });
            await TrezorUserEnvLink.startBridge();
            await TrezorUserEnvLink.stopEmu();
            await TrezorConnect.init({
                manifest: {
                    email: 'developer@xyz.com',
                    appUrl: 'http://your.application.com',
                },
                deeplinkOpen: url => {
                    openUriScheme(url, 'android');
                },
                deeplinkCallbackUrl: `${SERVER_URL}/connect/`,
            });
        }

        await openApp({ newInstance: true });
    });

    afterAll(async () => {
        if (platform === 'android') {
            await TrezorUserEnvLink.stopEmu();
        }
        await new Promise(resolve => {
            if (server) {
                server.close(() => {
                    resolve(null);
                });
            }
        });
        await device.terminateApp();
    });

    it('Navigate to dashboard', async () => {
        await onOnboarding.finishOnboarding();

        if (platform === 'android') {
            await TrezorUserEnvLink.startEmu();

            await waitFor(element(by.id('@screen/CoinEnablingInit')))
                .toBeVisible()
                .withTimeout(10000);

            await onCoinEnablingInit.waitForBtcToBeVisible();

            await onCoinEnablingInit.enableNetwork('btc');
            // TODO: I don't understand why without eth the part after does not complete.
            await onCoinEnablingInit.enableNetwork('eth');

            await onCoinEnablingInit.save();

            await waitFor(element(by.id('skip-view-only-mode')))
                .toBeVisible()
                .withTimeout(60000); // communication between connected Trezor and app takes some time.

            await element(by.id('skip-view-only-mode')).tap();

            await detoxExpect(element(by.id('@home/portfolio/graph'))); // discovery finished and graph is visible

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

            await new Promise((resolve, reject) => {
                if (JSON.stringify(response) === JSON.stringify(expectedResponse)) {
                    return resolve(null);
                }
                reject(new Error('Result does not match expected.'));
            });
        }
    });
});
