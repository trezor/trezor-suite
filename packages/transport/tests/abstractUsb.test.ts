import * as messages from '@trezor/protobuf/messages.json';
import { v1 as v1Protocol } from '@trezor/protocol';

import { UsbApi } from '../src/api/usb';
import * as ERRORS from '../src/errors';
import { AbstractApiTransport } from '../src/transports/abstractApi';
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
}

// we cant directly use abstract class (UsbTransport)
const initTest = async () => {
    // create usb api with navigator.usb mock
    const testUsbApi = new UsbApi({
        usbInterface: createUsbMock(),
    });
    const transport = new TestUsbTransport({
        api: testUsbApi,
        messages,
        id: 'test',
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
                id: 'test',
                messages: {},
            });

            await transport.init();
            const res = await transport.enumerate();

            expect(res).toEqual({
                success: false,
                error: { code: 'unexpected error', message: 'crazy error nobody expects' },
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
            transport.on('transport-device_connected', descriptor =>
                spy({ type: 'transport-device_connected', descriptor }),
            );
            transport.deviceEvents.on(PathPublic('1'), e => spy(e));

            transport.handleDescriptorsChange([
                { path: PathPublic('1'), session: null, type: 1, apiType: transport.apiType },
            ]);

            expect(spy).toHaveBeenCalledWith({
                type: 'transport-device_connected',
                descriptor: { path: '1', session: null, type: 1, apiType: 'usb' },
            });
            transport.handleDescriptorsChange([]);
            expect(spy).toHaveBeenCalledWith({ type: 'transport-device_disconnected' });
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
                        model: 0,
                        product: 21441,
                        vendor: 4617,
                        apiType: 'usb',
                        id: '123', // todo: why?
                    },
                    {
                        path: '2',
                        session: null,
                        type: 1,
                        model: 0,
                        product: 21441,
                        vendor: 4617,
                        apiType: 'usb',
                        id: null, // todo: why?
                    },
                ],
            });
        });

        it('acquire. transport is not listening', async () => {
            const { transport } = await initTest();
            jest.useFakeTimers();
            const spy = jest.fn();
            transport.on('transport-device_connected', spy);
            transport.deviceEvents.on(PathPublic('1'), spy);

            await transport.enumerate();

            jest.runAllTimers();

            const result = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(result).toEqual({ success: true, payload: '1' });

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it('call error - called without acquire.', async () => {
            const { transport } = await initTest();
            const res = await transport.call({
                name: 'GetAddress',
                data: {},
                session: Session('1'),
                protocol: v1Protocol,
            });
            expect(res).toEqual({
                success: false,
                error: { code: 'device disconnected during action' },
            });
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
                error: { code: 'unexpected error', message: 'no such type: Foo-bar message' },
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
            });
            expect(res).toEqual({
                success: true,
                payload: null,
            });
        });

        it('acquire - openDevice failure releases session lock', async () => {
            const { transport, testUsbApi } = await initTest();
            await transport.enumerate();

            jest.spyOn(testUsbApi, 'openDevice').mockResolvedValueOnce({
                success: false,
                error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
            });

            const failedAcquire = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(failedAcquire).toMatchObject({
                success: false,
                error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
            });

            // Lock was released via abort: a subsequent acquire on the same path succeeds.
            const retryAcquire = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(retryAcquire).toMatchObject({ success: true });
        });

        it('acquire - acquireDone failure closes opened device', async () => {
            const { transport, testUsbApi } = await initTest();
            await transport.enumerate();

            const closeDeviceSpy = jest.spyOn(testUsbApi, 'closeDevice');
            jest.spyOn(transport['sessionsClient'], 'acquireDone').mockResolvedValueOnce({
                success: false,
                error: { code: ERRORS.DEVICE_NOT_FOUND },
                id: 0,
            });

            const result = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(result).toMatchObject({
                success: false,
                error: { code: ERRORS.DEVICE_NOT_FOUND },
            });
            expect(closeDeviceSpy).toHaveBeenCalled();
        });

        it('concurrent call on same session - second fails with OTHER_CALL_IN_PROGRESS', async () => {
            let resolveTransferIn: (value: { data: Buffer }) => void = () => {};
            const deferredTransferIn = new Promise<{ data: Buffer }>(resolve => {
                resolveTransferIn = resolve;
            });
            const testUsbApi = new UsbApi({
                usbInterface: {
                    getDevices: () =>
                        Promise.resolve([
                            createMockedDevice({
                                transferIn: () => deferredTransferIn,
                            }),
                        ]),
                } as unknown as UsbApi['usbInterface'],
            });
            const transport = new TestUsbTransport({ api: testUsbApi, messages, id: 'test' });
            await transport.init();
            await transport.enumerate();
            const acquireRes = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            const [r1, r2] = await Promise.all([
                transport.call({
                    name: 'GetAddress',
                    data: {},
                    session: acquireRes.payload,
                    protocol: v1Protocol,
                }),
                transport.call({
                    name: 'GetAddress',
                    data: {},
                    session: acquireRes.payload,
                    protocol: v1Protocol,
                }),
                // release the blocking read once both calls raced for the lock
                Promise.resolve().then(() => {
                    const buffer = Buffer.alloc(64);
                    buffer.write(
                        '3f23230002000000060a046d656f7700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                        'hex',
                    );
                    resolveTransferIn({ data: buffer });
                }),
            ]);

            expect([r1, r2]).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ success: true }),
                    expect.objectContaining({
                        success: false,
                        error: { code: ERRORS.OTHER_CALL_IN_PROGRESS },
                    }),
                ]),
            );
        });

        it('concurrent call on different paths - both succeed (per-path synchronize)', async () => {
            const { transport } = await initTest();
            await transport.enumerate();
            const acquire1 = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            const acquire2 = await transport.acquire({
                input: { path: PathPublic('2'), previous: null },
            });
            expect(acquire1.success).toEqual(true);
            expect(acquire2.success).toEqual(true);
            if (!acquire1.success || !acquire2.success) return;

            const [r1, r2] = await Promise.all([
                transport.call({
                    name: 'GetAddress',
                    data: {},
                    session: acquire1.payload,
                    protocol: v1Protocol,
                }),
                transport.call({
                    name: 'GetAddress',
                    data: {},
                    session: acquire2.payload,
                    protocol: v1Protocol,
                }),
            ]);

            expect(r1).toMatchObject({ success: true });
            expect(r2).toMatchObject({ success: true });
        });

        it('concurrent call and send on same session - both succeed (send skips lock)', async () => {
            let resolveTransferIn: (value: { data: Buffer }) => void = () => {};
            const deferredTransferIn = new Promise<{ data: Buffer }>(resolve => {
                resolveTransferIn = resolve;
            });
            const testUsbApi = new UsbApi({
                usbInterface: {
                    getDevices: () =>
                        Promise.resolve([
                            createMockedDevice({
                                transferIn: () => deferredTransferIn,
                            }),
                        ]),
                } as unknown as UsbApi['usbInterface'],
            });
            const transport = new TestUsbTransport({ api: testUsbApi, messages, id: 'test' });
            await transport.init();
            await transport.enumerate();
            const acquireRes = await transport.acquire({
                input: { path: PathPublic('1'), previous: null },
            });
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            const [callRes, sendRes] = await Promise.all([
                transport.call({
                    name: 'GetAddress',
                    data: {},
                    session: acquireRes.payload,
                    protocol: v1Protocol,
                }),
                transport.send({
                    name: 'GetAddress',
                    data: {},
                    session: acquireRes.payload,
                    protocol: v1Protocol,
                }),
                Promise.resolve().then(() => {
                    const buffer = Buffer.alloc(64);
                    buffer.write(
                        '3f23230002000000060a046d656f7700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                        'hex',
                    );
                    resolveTransferIn({ data: buffer });
                }),
            ]);

            expect(callRes).toMatchObject({ success: true });
            expect(sendRes).toMatchObject({ success: true });
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

            await expect(promise).resolves.toMatchObject({
                success: false,
                error: { code: 'Aborted by signal' },
            });

            const promise2 = transport.call({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
                protocol: v1Protocol,
            });
            await promise2;
            await expect(promise2).resolves.toEqual({
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
