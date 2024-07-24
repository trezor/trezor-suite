import * as messages from '@trezor/protobuf/messages.json';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { BridgeTransport } from '@trezor/transport';

// todo: introduce global jest config for e2e
jest.setTimeout(60000);

const mnemonicAll = 'all all all all all all all all all all all all';

const emulatorSetupOpts = {
    mnemonic: mnemonicAll,
    pin: '',
    passphrase_protection: false,
    label: 'TrezorT',
    needs_backup: true,
};

const emulatorStartOpts = { version: '2-main', wipe: true };

describe('bridge', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
    });

    afterAll(async () => {
        await TrezorUserEnvLink.send({ type: 'emulator-stop' });
        await TrezorUserEnvLink.send({ type: 'bridge-stop' });
        TrezorUserEnvLink.disconnect();
    });

    let bridge: any;
    let devices: any[];
    let session: any;
    beforeEach(async () => {
        // todo: swapping emulator-stop and bridge-stop line can simulate "emulator process died" error
        await TrezorUserEnvLink.send({ type: 'emulator-stop' });
        await TrezorUserEnvLink.send({ type: 'bridge-stop' });
        await TrezorUserEnvLink.send({ type: 'emulator-start', ...emulatorStartOpts });
        await TrezorUserEnvLink.send({ type: 'emulator-setup', ...emulatorSetupOpts });
        await TrezorUserEnvLink.send({ type: 'bridge-start' });
        const abortController = new AbortController();
        bridge = new BridgeTransport({ messages, signal: abortController.signal });
        await bridge.init().promise;

        const enumerateResult = await bridge.enumerate().promise;
        expect(enumerateResult).toEqual({
            success: true,
            payload: [
                {
                    path: '1',
                    session: null,
                    product: 0,
                    vendor: 0,
                    // we don't use it but bridge returns
                    debug: true,
                    debugSession: null,
                },
            ],
        });
        devices = enumerateResult.payload;

        const acquireResult = await bridge.acquire({ input: { path: devices[0].path } }).promise;
        expect(acquireResult).toEqual({
            success: true,
            payload: '1',
        });
        session = acquireResult.payload;
    });

    test(`call(GetFeatures)`, async () => {
        const message = await bridge.call({ session, name: 'GetFeatures', data: {} }).promise;
        expect(message).toMatchObject({
            success: true,
            payload: {
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                    label: 'TrezorT',
                },
            },
        });
    });

    test(`send(GetFeatures) - receive`, async () => {
        const sendResponse = await bridge.send({ session, name: 'GetFeatures', data: {} }).promise;
        expect(sendResponse).toEqual({ success: true, payload: undefined });

        const receiveResponse = await bridge.receive({ session }).promise;
        expect(receiveResponse).toMatchObject({
            success: true,
            payload: {
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                    label: 'TrezorT',
                },
            },
        });
    });

    test(`call(ChangePin) - send(Cancel) - receive`, async () => {
        // initiate change pin procedure on device
        const callResponse = await bridge.call({ session, name: 'ChangePin', data: {} }).promise;
        expect(callResponse).toMatchObject({
            success: true,
            payload: {
                type: 'ButtonRequest',
            },
        });

        // cancel change pin procedure
        const sendResponse = await bridge.send({ session, name: 'Cancel', data: {} }).promise;
        expect(sendResponse).toEqual({ success: true, payload: undefined });

        // receive response
        const receiveResponse = await bridge.receive({ session }).promise;
        expect(receiveResponse).toMatchObject({
            success: true,
            payload: {
                type: 'Failure',
                message: {
                    code: 'Failure_ActionCancelled',
                    message: 'Cancelled',
                },
            },
        });

        // validate that we can continue with communication
        const message = await bridge.call({
            session,
            name: 'GetFeatures',
            data: {},
        }).promise;
        expect(message).toMatchObject({
            success: true,
            payload: {
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                    label: 'TrezorT',
                },
            },
        });
    });

    test(`call(Backup) - send(Cancel) - receive`, async () => {
        // initiate backup procedure on device
        const callResponse = await bridge.call({ session, name: 'BackupDevice', data: {} }).promise;
        expect(callResponse).toMatchObject({
            success: true,
            payload: {
                type: 'ButtonRequest',
            },
        });

        // cancel backup procedure
        const sendResponse = await bridge.send({ session, name: 'Cancel', data: {} }).promise;
        expect(sendResponse).toEqual({ success: true });

        // receive response
        const receiveResponse = await bridge.receive({ session }).promise;
        expect(receiveResponse).toMatchObject({
            success: true,
            payload: {
                type: 'Failure',
                message: {
                    code: 'Failure_ActionCancelled',
                    message: 'Cancelled',
                },
            },
        });

        // validate that we can continue with communication
        const message = await bridge.call({ session, name: 'GetFeatures', data: {} }).promise;
        expect(message).toMatchObject({
            success: true,
            payload: {
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                    label: 'TrezorT',
                },
            },
        });
    });
});
