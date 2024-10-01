import { v1 as v1Protocol } from '@trezor/protocol';
import { AbstractTransport } from '../src/transports/abstract';
import { AbstractApiTransport } from '../src/transports/abstractApi';
import { UsbApi } from '../src/api/usb';
import { SessionsClient } from '../src/sessions/client';
import { SessionsBackground } from '../src/sessions/background';
import * as messages from '@trezor/protobuf/messages.json';
import { PathPublic, Session } from '../src/types';

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
    public apiType = 'usb' as const;
    public sessionsClient = new SessionsClient({});

    constructor({ messages, api }: ConstructorParameters<typeof AbstractApiTransport>[0]) {
        super({
            messages,
            api,
        });
    }

    init() {
        return this.scheduleAction(async () => {
            const sessionsBackground = new SessionsBackground();

            // in nodeusb there is no synchronization yet. this is a followup and needs to be decided
            // so far, sessionsClient has direct access to sessionBackground
            this.sessionsClient.init({
                requestFn: args => sessionsBackground.handleMessage(args),
                registerBackgroundCallbacks: () => {},
            });

            sessionsBackground.on('descriptors', descriptors => {
                this.sessionsClient.emit('descriptors', descriptors);
            });

            const handshakeRes = await this.sessionsClient.handshake();
            this.stopped = !handshakeRes.success;

            return handshakeRes;
        });
    }
}
// we cant directly use abstract class (UsbTransport)
const initTest = async () => {
    let transport: AbstractTransport;
    let testUsbApi: UsbApi;

    // create usb api with navigator.usb mock
    testUsbApi = new UsbApi({
        usbInterface: createUsbMock(),
    });

    transport = new TestUsbTransport({
        api: testUsbApi,
        messages,
    });
    const initResponse = await transport.init();
    expect(initResponse.success).toEqual(true);

    return {
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
        it('enumerate error', async () => {
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
            });

            await transport.init();
            const res = await transport.enumerate();

            expect(res).toEqual({
                success: false,
                error: 'unexpected error',
                message: 'crazy error nobody expects',
            });
        });
    });

    describe('with initiated transport', () => {
        it('listen twice -> error', async () => {
            const { transport } = await initTest();
            const res1 = transport.listen();
            expect(res1.success).toEqual(true);
            const res2 = transport.listen();
            expect(res2.success).toEqual(false);
        });

        it('handleDescriptorsChange', async () => {
            const { transport } = await initTest();
            const spy = jest.fn();
            transport.on('transport-update', spy);

            transport.handleDescriptorsChange([{ path: PathPublic('1'), session: null, type: 1 }]);

            expect(spy).toHaveBeenCalledWith([
                { type: 'connected', descriptor: { path: '1', session: null, type: 1 } },
            ]);
            transport.handleDescriptorsChange([]);
            expect(spy).toHaveBeenCalledWith([
                { type: 'disconnected', descriptor: { path: '1', session: null, type: 1 } },
            ]);
        });

        it('enumerate', async () => {
            const { transport } = await initTest();
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
        });

        it('acquire. transport is not listening', async () => {
            const { transport } = await initTest();
            jest.useFakeTimers();
            const spy = jest.fn();
            transport.on('transport-update', spy);

            await transport.enumerate();

            jest.runAllTimers();

            const result = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(result).toEqual({
                success: true,
                payload: '1',
            });

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it('acquire. transport listening. missing descriptor', async () => {
            const { transport } = await initTest();

            const enumerateResult = await transport.enumerate();

            expect(enumerateResult.success).toEqual(true);
            // @ts-expect-error
            transport.handleDescriptorsChange(enumerateResult.payload);

            transport.listen();

            // set some initial descriptors
            const acquireCall = transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });

            setTimeout(() => {
                // @ts-expect-error (private field accessed in tests)
                transport.sessionsClient.emit('descriptors', [
                    { path: PathPublic('321'), session: Session('1'), type: 1 },
                ]);
            }, 1);

            const res = await acquireCall;

            expect(res).toMatchObject({
                success: false,
                error: 'device disconnected during action',
            });
        });

        it('acquire. transport listening. unexpected session', async () => {
            const { transport } = await initTest();
            const enumerateResult = await transport.enumerate();
            expect(enumerateResult.success).toEqual(true);
            // @ts-expect-error
            transport.handleDescriptorsChange(enumerateResult.payload);

            transport.listen();

            // set some initial descriptors
            const acquireCall = transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            setTimeout(() => {
                // @ts-expect-error (private field accessed in tests)
                transport.sessionsClient.emit('descriptors', [
                    { path: PathPublic('1'), session: Session('2'), type: 1, product: 21441 },
                ]);
            }, 1);

            const res = await acquireCall;
            expect(res).toMatchObject({ success: false, error: 'wrong previous session' });
        });

        it('call error - called without acquire.', async () => {
            const { transport } = await initTest();
            const res = await transport.call({
                name: 'GetAddress',
                data: {},
                session: Session('1'),
                protocol: v1Protocol,
            });
            expect(res).toEqual({ success: false, error: 'device disconnected during action' });
        });

        it('call - with valid and invalid message.', async () => {
            const { transport } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
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
        });

        it('send and receive.', async () => {
            const { transport } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
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
        });

        it('send protocol-v1 with custom chunkSize', async () => {
            const { transport, testUsbApi } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
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
        });

        it('release', async () => {
            const { transport } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            expect(acquireRes.payload).toEqual('1');

            // doesn't really matter what what message we send
            const res = await transport.release({
                session: acquireRes.payload,
                path: PathPublic('123'),
                onClose: false,
            });
            expect(res).toEqual({
                success: true,
                payload: undefined,
            });
        });

        it('call - with use abort', async () => {
            const { transport } = await initTest();
            await transport.enumerate();
            const acquireRes = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
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
        });
    });
});
