import { expect as jestExpect } from '@jest/globals';
import { exec } from 'child_process';
import fetch from 'cross-fetch';
import { expect as detoxExpect } from 'detox';

import { CARDANO, PROTO } from '@trezor/connect';
import TrezorConnect from '@trezor/connect-mobile';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { deviceAutoEjectState } from '../fixtures/deviceAutoEjectState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { DeepLinkServer } from '../support/deepLinkServer';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const BRIDGE_URL = 'http://127.0.0.1:21328';

const deepLinkServer = new DeepLinkServer();

const openUriScheme = (url: string, platformToOpen: 'android') => {
    const command = `yarn exec uri-scheme open '${url.replace(/'/g, '%27')}' --${platformToOpen} --raw`;

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

const signExampleMessage = () =>
    TrezorConnect.signMessage({
        path: "m/49'/0'/0'/0/0",
        message: 'example message',
        coin: 'btc',
    });

const approvePermissionsAndWaitForConfirmOnTrezor = async () => {
    await waitForVisible(by.id('@popup/deeplink-info'));

    // Skip waiting for Reanimated animations.
    await device.disableSynchronization();

    const permissionButton = element(by.id('@popup/call-device'));
    await waitForVisible(permissionButton);
    await permissionButton.tap();

    await waitForVisible(by.id('@popup/confirm-on-trezor'));
};

// Connect aborts a running call as used elsewhere when another client takes over its session.
const takeOverDeviceSession = async () => {
    const enumerateResponse = await fetch(`${BRIDGE_URL}/enumerate`, { method: 'POST' });
    const [{ path, session }] = await enumerateResponse.json();

    const acquireResponse = await fetch(`${BRIDGE_URL}/acquire/${path}/${session}`, {
        method: 'POST',
    });
    jestExpect(acquireResponse.ok).toBe(true);
};

const closeErrorScreen = async () => {
    await waitForVisible(by.id('@popup/connect-error'));

    // Skip waiting for Reanimated animations.
    await device.disableSynchronization();

    const closeButton = element(by.id('@popup/close'));
    await waitForVisible(closeButton);
    await closeButton.tap();
};

const getFailedResponseMatcher = (code: string) => ({
    success: false,
    id: jestExpect.any(String),
    error: jestExpect.objectContaining({ code }),
});

// The callback url opens in the browser, which moves the app to the background.
const returnToAppAndAssertErrorScreenLeft = async () => {
    await device.launchApp({ newInstance: false });

    await waitForVisible(by.id('@screen/Home'));
    await detoxExpect(element(by.id('@popup/connect-error'))).not.toBeVisible();

    await device.enableSynchronization();
};

describe('Deeplink connect popup. [@androidOnly @T3T1]', () => {
    beforeAll(async () => {
        await deepLinkServer.start();
        await device.reverseTcpPort(deepLinkServer.port);
    });

    beforeEach(async () => {
        await prepareTrezorEmulator();
        await openApp({ args: { preloadedState } });
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });

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
        await device.unreverseTcpPort(deepLinkServer.port);
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
            id: jestExpect.any(String),
            payload: jestExpect.objectContaining({
                path: [2147483697, 2147483648, 2147483648, 0, 0],
                serializedPath: "m/49'/0'/0'/0/0",
                address: jestExpect.any(String),
            }),
        });
    });

    it('Handle Cardano deeplink — permission grant enables derive_cardano', async () => {
        // The preloaded wallet enables only BTC, so 'ada' is NOT in Connect's init-seeded enabled
        // set. Cardano derivation here depends entirely on the permission grant being projected
        // into Connect's enabledNetworks by the shared connect-popup call thunk — the regression
        // guard for the native deeplink path. Without that projection the session is created
        // without derive_cardano and the call fails.
        const promise = TrezorConnect.cardanoGetAddress({
            addressParameters: {
                addressType: PROTO.CardanoAddressType.BYRON,
                path: "m/44'/1815'/0'/0/0",
            },
            protocolMagic: CARDANO.PROTOCOL_MAGICS.mainnet,
            networkId: CARDANO.NETWORK_IDS.mainnet,
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
            id: jestExpect.any(String),
            payload: jestExpect.objectContaining({
                address: jestExpect.any(String),
            }),
        });
    });

    it('Closing the error screen answers a call refused before it starts', async () => {
        // Deeplinks may not push transactions, so the popup refuses this before anything is sent.
        const promise = TrezorConnect.pushTransaction({ tx: '00', coin: 'btc' });

        await closeErrorScreen();

        jestExpect(await promise).toEqual(getFailedResponseMatcher('Method_NotAllowed'));
        await returnToAppAndAssertErrorScreenLeft();
    });

    it('Closing the error screen answers a call rejected on the device', async () => {
        const promise = signExampleMessage();

        await approvePermissionsAndWaitForConfirmOnTrezor();
        await TrezorUserEnvLink.pressNo();
        await closeErrorScreen();

        jestExpect(await promise).toEqual(getFailedResponseMatcher('Failure_ActionCancelled'));
        await returnToAppAndAssertErrorScreenLeft();
    });

    it('Closing the error screen answers a call whose device is used elsewhere', async () => {
        const promise = signExampleMessage();

        await approvePermissionsAndWaitForConfirmOnTrezor();
        await takeOverDeviceSession();
        await closeErrorScreen();

        jestExpect(await promise).toEqual(getFailedResponseMatcher('Device_UsedElsewhere'));
        await returnToAppAndAssertErrorScreenLeft();
    });
});
