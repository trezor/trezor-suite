import { v1 as v1Protocol } from '@trezor/protocol';
import { AbstractTransport } from '../src/transports/abstract';
import { AbstractApiTransport } from '../src/transports/abstractApi';
import { UsbApi } from '../src/api/usb';
import { SessionsClient } from '../src/sessions/client';
import { SessionsBackground } from '../src/sessions/background';
import * as messages from '@trezor/protobuf/messages.json';

// create devices otherwise returned from navigator.usb.getDevices
const createMockedDevice = (optional = {}) => ({
    vendorId: 0x1209,
    productId: 0x53c1,
    serialNumber: '123',
    open: () => Promise.resolve(),
    selectConfiguration: () => Promise.resolve(),
    claimInterface: () => Promise.resolve(),
    transferOut: () => Promise.resolve({ status: 'ok' }),
    transferIn: () => {
        const buffer = Buffer.alloc(64);
        // encoded valid "Success" message
        buffer.write(
            '3f23230002000000060a046d656f7700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            'hex',
        );

        return Promise.resolve({
            data: buffer,
        });
    },
    releaseInterface: () => Promise.resolve(),
    close: () => Promise.resolve(),
    ...optional,
});

// mock of navigator.usb
const createUsbMock = (optional = {}) =>
    ({
        getDevices: () =>
            Promise.resolve([createMockedDevice(), createMockedDevice({ serialNumber: null })]),
        ...optional,
    }) as unknown as UsbApi['usbInterface'];

class TestUsbTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;

    constructor({
        messages,
        api,
        sessionsClient,
    }: ConstructorParameters<typeof AbstractApiTransport>[0]) {
        super({
            messages,
            api,
            sessionsClient,
        });
    }
}
// we cant directly use abstract class (UsbTransport)
const initTest = async () => {
    let sessionsBackground: SessionsBackground;
    let sessionsClient: SessionsClient;
    let transport: AbstractTransport;
    let testUsbApi: UsbApi;

    sessionsBackground = new SessionsBackground();

    sessionsClient = new SessionsClient({
        requestFn: params => sessionsBackground.handleMessage(params),
        registerBackgroundCallbacks: onDescriptorsCallback => {
            sessionsBackground.on('descriptors', descriptors => {
                onDescriptorsCallback(descriptors);
            });
        },
    });

    sessionsBackground.on('descriptors', descriptors => {
        sessionsClient.emit('descriptors', descriptors);
    });

    // create usb api with navigator.usb mock
    testUsbApi = new UsbApi({
        usbInterface: createUsbMock(),
    });

    transport = new TestUsbTransport({
        api: testUsbApi,
        sessionsClient,
        messages,
    });
    await transport.init();

    return {
        sessionsBackground,
        sessionsClient,
        transport,
        testUsbApi,
    };
};

describe('Usb', () => {
    beforeEach(() => {
        jest.useRealTimers();
    });

    afterEach(() => {});

    afterAll(async () => {});

    describe('without initiated transport', () => {
        it('init error', async () => {
            const sessionsClient = new SessionsClient({
                // @ts-expect-error
                requestFn: _params => ({ type: 'meow' }),
                registerBackgroundCallbacks: () => {},
            });

            // create usb api with navigator.usb mock
            const testUsbApi = new UsbApi({
                usbInterface: createUsbMock(),
            });

            const transport = new TestUsbTransport({
                api: testUsbApi,
                sessionsClient,
            });

            // there are no loaded messages
            expect(transport.getMessage()).toEqual(false);

            const res = await transport.init();
            expect(res).toMatchObject({
                success: false,
            });
        });

        it('enumerate error', async () => {
            const sessionsBackground = new SessionsBackground();

            const sessionsClient = new SessionsClient({
                requestFn: params => sessionsBackground.handleMessage(params),
                registerBackgroundCallbacks: () => {},
            });

            // create usb api with navigator.usb mock
            const testUsbApi = new UsbApi({
                usbInterface: createUsbMock({
                    getDevices: () => {
                        throw new Error('crazy error nobody expects');
                    },
                }),
            });

            const transport = new TestUsbTransport({
                api: testUsbApi,
                sessionsClient,
            });

            await transport.init();
            const res = await transport.enumerate();

            expect(res).toEqual({
                success: false,
                error: 'unexpected error',
                message: 'crazy error nobody expects',
            });

            sessionsBackground.dispose();
        });
    });

    describe('with initiated transport', () => {
        it('listen twice -> error', async () => {
            const { transport, sessionsBackground } = await initTest();
            const res1 = transport.listen();
            expect(res1.success).toEqual(true);
            const res2 = transport.listen();
            expect(res2.success).toEqual(false);
            sessionsBackground.dispose();
        });

        it('handleDescriptorsChange', async () => {
            const { transport, sessionsBackground } = await initTest();
            const spy = jest.fn();
            transport.on('transport-update', spy);

            transport.handleDescriptorsChange([{ path: '1', session: null, type: 1 }]);

            expect(spy).toHaveBeenCalledWith([
                { type: 'connected', descriptor: { path: '1', session: null, type: 1 } },
            ]);
            transport.handleDescriptorsChange([]);
            expect(spy).toHaveBeenCalledWith([
                { type: 'disconnected', descriptor: { path: '1', session: null, type: 1 } },
            ]);
            sessionsBackground.dispose();
        });

        it('enumerate', async () => {
            const { transport, sessionsBackground } = await initTest();
            const res = await transport.enumerate();
            expect(res).toEqual({
                success: true,
                payload: [
                    {
                        path: '1',
                        session: null,
                        type: 1,
                        product: 21441,
                        vendor: 4617,
                    },
                    {
                        path: '2',
                        session: null,
                        type: 1,
                        product: 21441,
                        vendor: 4617,
                    },
                ],
            });
            sessionsBackground.dispose();
        });

        it('acquire. transport is not listening', async () => {
            const { transport, sessionsBackground } = await initTest();
            jest.useFakeTimers();
            const spy = jest.fn();
            transport.on('transport-update', spy);

            await transport.enumerate();

            jest.runAllTimers();

            const result = await transport.acquire({ input: { path: '1', previous: null } });
            expect(result).toEqual({
                success: true,
                payload: '1',
            });

            expect(spy).toHaveBeenCalledTimes(0);
            sessionsBackground.dispose();
        });

        it('acquire. transport listening. missing descriptor', async () => {
            const { transport, sessionsClient, sessionsBackground } = await initTest();

            sessionsBackground.removeAllListeners();

            const enumerateResult = await transport.enumerate();

            expect(enumerateResult.success).toEqual(true);
            // @ts-expect-error
            transport.handleDescriptorsChange(enumerateResult.payload);

            transport.listen();

            // set some initial descriptors
            const acquireCall = transport.acquire({ input: { path: '1', previous: null } });

            setTimeout(() => {
                sessionsClient.emit('descriptors', [{ path: '321', session: '1', type: 1 }]);
            }, 1);

            const res = await acquireCall;

            expect(res).toMatchObject({
                success: false,
                error: 'device disconnected during action',
            });
            sessionsBackground.dispose();
        });

        it('acquire. transport listening. unexpected session', async () => {
            const { transport, sessionsClient, sessionsBackground } = await initTest();
            sessionsBackground.removeAllListeners();
            const enumerateResult = await transport.enumerate();
            expect(enumerateResult.success).toEqual(true);
            // @ts-expect-error
            transport.handleDescriptorsChange(enumerateResult.payload);

            transport.listen();

            // set some initial descriptors
            const acquireCall = transport.acquire({ input: { path: '1', previous: null } });
            setTimeout(() => {
                sessionsClient.emit('descriptors', [
                    { path: '1', session: '2', type: 1, product: 21441 },
                ]);
            }, 1);

            const res = await acquireCall;
            expect(res).toMatchObject({ success: false, error: 'wrong previous session' });
            sessionsBackground.dispose();
        });

        it('call error - called without acquire.', async () => {
            const { transport, sessionsBackground } = await initTest();
            const res = await transport.call({
                name: 'GetAddress',
                data: {},
                session: '1',
                protocol: v1Protocol,
            });
            expect(res).toEqual({ success: false, error: 'device disconnected during action' });
            sessionsBackground.dispose();
        });

        it('call - with valid and invalid message.', async () => {
            const { transport, sessionsBackground } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({ input: { path: '1', previous: null } });
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            expect(acquireRes.payload).toEqual('1');

            expect(transport.getMessage('GetAddress')).toEqual(true);

            // doesn't really matter what what message we send
            const res1 = await transport.call({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
                protocol: v1Protocol,
            });
            expect(res1).toEqual({
                success: true,
                payload: {
                    type: 'Success',
                    message: {
                        message: 'meow',
                    },
                },
            });

            const res2 = await transport.call({
                name: 'Foo-bar message',
                data: {},
                session: acquireRes.payload,
                protocol: v1Protocol,
            });
            expect(res2).toEqual({
                success: false,
                error: 'unexpected error',
                message: 'no such type: Foo-bar message',
            });

            sessionsBackground.dispose();
        });

        it('send and receive.', async () => {
            const { transport, sessionsBackground } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({ input: { path: '1', previous: null } });
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            expect(acquireRes.payload).toEqual('1');

            // doesn't really matter what what message we send
            const sendRes = await transport.send({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
                protocol: v1Protocol,
            });
            expect(sendRes).toEqual({
                success: true,
                payload: undefined,
            });
            const receiveRes = await transport.receive({
                session: acquireRes.payload,
                protocol: v1Protocol,
            });
            expect(receiveRes).toEqual({
                success: true,
                payload: {
                    type: 'Success',
                    message: {
                        message: 'meow',
                    },
                },
            });
            sessionsBackground.dispose();
        });

        it('send protocol-v1 with custom chunkSize', async () => {
            const { transport, testUsbApi, sessionsBackground } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({ input: { path: '1', previous: null } });
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            const writeSpy = jest
                .spyOn(testUsbApi, 'write')
                .mockImplementation(() => Promise.resolve({ success: true, payload: undefined }));

            const send = () =>
                transport.send({
                    name: 'SignMessage',
                    data: {
                        message: '00'.repeat(200),
                    },
                    session: acquireRes.payload,
                    protocol: v1Protocol,
                });

            // count encoded/sent chunks
            await send(); // 64 default chunkSize for usb
            expect(writeSpy).toHaveBeenCalledTimes(4);
            writeSpy.mockClear();

            testUsbApi.chunkSize = 16;
            await send(); // smaller chunks
            expect(writeSpy).toHaveBeenCalledTimes(15);
            writeSpy.mockClear();

            testUsbApi.chunkSize = 128;
            await send(); // bigger chunks
            expect(writeSpy).toHaveBeenCalledTimes(2);
            writeSpy.mockClear();
            sessionsBackground.dispose();
        });

        it('release', async () => {
            const { transport, sessionsBackground } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({ input: { path: '1', previous: null } });
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            expect(acquireRes.payload).toEqual('1');

            // doesn't really matter what what message we send
            const res = await transport.release({
                session: acquireRes.payload,
                path: '123',
                onClose: false,
            });
            expect(res).toEqual({
                success: true,
                payload: undefined,
            });
            sessionsBackground.dispose();
        });

        it('call - with use abort', async () => {
            const { transport, sessionsBackground } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({ input: { path: '1', previous: null } });
            if (!acquireRes.success) return;

            const abort = new AbortController();
            const promise = transport.call({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
                protocol: v1Protocol,
                signal: abort.signal,
            });
            abort.abort();

            expect(promise).resolves.toMatchObject({
                success: false,
                error: 'Aborted by signal',
            });

            const promise2 = transport.call({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
                protocol: v1Protocol,
            });
            await promise2;
            expect(promise2).resolves.toEqual({
                success: true,
                payload: {
                    type: 'Success',
                    message: {
                        message: 'meow',
                    },
                },
            });
            sessionsBackground.dispose();
        });
    });
});
