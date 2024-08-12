import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport } from '@trezor/transport';

import { controller as TrezorUserEnvLink } from '../controller';
import { pathLength, descriptor as expectedDescriptor } from '../expect';

// todo: introduce global jest config for e2e
jest.setTimeout(60000);

const emulatorStartOpts = { version: '2-main', wipe: true };

describe('bridge', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    let bridge: any;
    let devices: any[];
    let session: any;
    beforeEach(async () => {
        // await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.startEmu(emulatorStartOpts);
        await TrezorUserEnvLink.startBridge();
        const abortController = new AbortController();
        bridge = new BridgeTransport({ messages, signal: abortController.signal });
        await bridge.init().promise;

        const enumerateResult = await bridge.enumerate().promise;
        expect(enumerateResult).toMatchObject({
            success: true,
            payload: [
                {
                    path: expect.any(String),
                    session: null,
                    product: expectedDescriptor.product,
                },
            ],
        });

        const { path } = enumerateResult.payload[0];
        expect(path.length).toEqual(pathLength);

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
                },
            },
        });
    });

    test(`call(RebootToBootloader) - send(Cancel) - receive`, async () => {
        // initiate RebootToBootloader procedure on device (it works regardless device is wiped or not)
        const callResponse = await bridge.call({ session, name: 'RebootToBootloader', data: {} })
            .promise;
        expect(callResponse).toMatchObject({
            success: true,
            payload: {
                type: 'ButtonRequest',
            },
        });

        // cancel RebootToBootloader procedure
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
                },
            },
        });
    });
});
