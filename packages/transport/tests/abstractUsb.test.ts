import { AbstractTransport } from '../src/transports/abstract';
import { AbstractUsbTransport, UsbTransportConstructorParams } from '../src/transports/abstractUsb';
import { UsbInterface } from '../src/interfaces/usb';
import { SessionsClient } from '../src/sessions/client';
import { SessionsBackground } from '../src/sessions/background';
import * as messages from '@trezor/protobuf/messages.json';

// we cant directly use abstract class (UsbTransport)
class TestUsbTransport extends AbstractUsbTransport {
    public name = 'WebUsbTransport' as const;

    constructor({ messages, usbInterface, sessionsClient, signal }: UsbTransportConstructorParams) {
        super({
            messages,
            usbInterface,
            sessionsClient,
            signal,
        });
    }
}

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
const createUsbMock = (optional = {}) => ({
    getDevices: () =>
        Promise.resolve([createMockedDevice(), createMockedDevice({ serialNumber: null })]),
    ...optional,
});

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

            // create usb interface with navigator.usb mock
            const testUsbInterface = new UsbInterface({
                // @ts-expect-error
                usbInterface: createUsbMock(),
            });

            const transport = new TestUsbTransport({
                usbInterface: testUsbInterface,
                sessionsClient,
            });

            // there are no loaded messages
            expect(transport.getMessage()).toEqual(false);

            const res = await transport.init().promise;
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

            // create usb interface with navigator.usb mock
            const testUsbInterface = new UsbInterface({
                // @ts-expect-error
                usbInterface: createUsbMock({
                    getDevices: () => {
                        throw new Error('crazy error nobody expects');
                    },
                }),
            });

            const transport = new TestUsbTransport({
                usbInterface: testUsbInterface,
                sessionsClient,
            });

            await transport.init().promise;
            const res = await transport.enumerate().promise;

            expect(res).toEqual({
                success: false,
                error: 'unexpected error',
                message: 'crazy error nobody expects',
            });
        });
    });

    describe('with initiated transport', () => {
        let sessionsBackground: SessionsBackground;
        let sessionsClient: SessionsClient;
        let transport: AbstractTransport;
        let testUsbInterface: UsbInterface;
        let abortController: AbortController;

        beforeEach(async () => {
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

            // create usb interface with navigator.usb mock
            testUsbInterface = new UsbInterface({
                // @ts-expect-error
                usbInterface: createUsbMock(),
            });

            abortController = new AbortController();

            transport = new TestUsbTransport({
                usbInterface: testUsbInterface,
                sessionsClient,
                messages,
                signal: abortController.signal,
            });

            await transport.init().promise;
        });

        it('listen twice -> error', () => {
            const res1 = transport.listen();
            expect(res1.success).toEqual(true);
            const res2 = transport.listen();
            expect(res2.success).toEqual(false);
        });

        it('handleDescriptorsChange', () => {
            const spy = jest.fn();
            transport.on('transport-update', spy);

            transport.handleDescriptorsChange([{ path: '1', session: null }]);

            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    connected: [{ path: '1', session: null }],
                    didUpdate: true,
                    descriptors: [{ path: '1', session: null }],
                }),
            );
            transport.handleDescriptorsChange([]);
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({
                    disconnected: [{ path: '1', session: null }],
                    didUpdate: true,
                    descriptors: [],
                }),
            );
        });

        it('enumerate', async () => {
            const res = await transport.enumerate().promise;
            expect(res).toEqual({
                success: true,
                payload: [
                    {
                        path: '123',
                        session: null,
                    },
                    {
                        path: 'bootloader1',
                        session: null,
                    },
                ],
            });
        });

        it('acquire. transport is not listening', async () => {
            jest.useFakeTimers();
            const spy = jest.fn();
            transport.on('transport-update', spy);

            await transport.enumerate().promise;

            jest.runAllTimers();

            expect(
                transport.acquire({ input: { path: '123', previous: null } }).promise,
            ).resolves.toEqual({
                success: true,
                payload: '1',
            });

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it('acquire. transport listening. missing descriptor', async () => {
            sessionsBackground.removeAllListeners();
            const enumerateResult = await transport.enumerate().promise;
            expect(enumerateResult.success).toEqual(true);
            // @ts-expect-error
            transport.handleDescriptorsChange(enumerateResult.payload);

            transport.listen();

            // set some initial descriptors
            const acquireCall = transport.acquire({ input: { path: '123', previous: null } });

            setTimeout(() => {
                sessionsClient.emit('descriptors', [{ path: '321', session: '1' }]);
            }, 1);

            const res = await acquireCall.promise;

            expect(res).toMatchObject({
                success: false,
                error: 'device disconnected during action',
            });
        });

        it('acquire. transport listening. unexpected session', async () => {
            sessionsBackground.removeAllListeners();
            const enumerateResult = await transport.enumerate().promise;
            expect(enumerateResult.success).toEqual(true);
            // @ts-expect-error
            transport.handleDescriptorsChange(enumerateResult.payload);

            transport.listen();

            // set some initial descriptors
            const acquireCall = transport.acquire({ input: { path: '123' } });
            setTimeout(() => {
                sessionsClient.emit('descriptors', [{ path: '123', session: '2' }]);
            }, 1);

            const res = await acquireCall.promise;
            expect(res).toMatchObject({ success: false, error: 'wrong previous session' });
        });

        it('call error - called without acquire.', async () => {
            const res = await transport.call({ name: 'GetAddress', data: {}, session: '1' })
                .promise;
            expect(res).toEqual({ success: false, error: 'device disconnected during action' });
        });

        it('call - with valid message.', async () => {
            await transport.enumerate().promise;
            const acquireRes = await transport.acquire({ input: { path: '123', previous: null } })
                .promise;
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            expect(acquireRes.payload).toEqual('1');

            expect(transport.getMessage('GetAddress')).toEqual(true);

            // doesn't really matter what what message we send
            const res = await transport.call({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
            }).promise;
            expect(res).toEqual({
                success: true,
                payload: {
                    type: 'Success',
                    message: {
                        message: 'meow',
                    },
                },
            });
        });

        it('send and receive.', async () => {
            await transport.enumerate().promise;
            const acquireRes = await transport.acquire({ input: { path: '123', previous: null } })
                .promise;
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            expect(acquireRes.payload).toEqual('1');

            // doesn't really matter what what message we send
            const sendRes = await transport.send({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
            }).promise;
            expect(sendRes).toEqual({
                success: true,
                payload: undefined,
            });
            const receiveRes = await transport.receive({
                session: acquireRes.payload,
            }).promise;
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

        it('release', async () => {
            await transport.enumerate().promise;
            const acquireRes = await transport.acquire({ input: { path: '123', previous: null } })
                .promise;
            expect(acquireRes.success).toEqual(true);
            if (!acquireRes.success) return;

            expect(acquireRes.payload).toEqual('1');

            // doesn't really matter what what message we send
            const res = await transport.release({
                session: acquireRes.payload,
                path: '123',
                onClose: false,
            }).promise;
            expect(res).toEqual({
                success: true,
                payload: undefined,
            });
        });

        it('call - with use abort', async () => {
            await transport.enumerate().promise;
            const acquireRes = await transport.acquire({ input: { path: '123', previous: null } })
                .promise;
            if (!acquireRes.success) return;

            const { promise, abort } = transport.call({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
            });
            abort();

            expect(promise).resolves.toMatchObject({
                success: false,
                error: 'Aborted by signal',
            });

            const { promise: promise2 } = transport.call({
                name: 'GetAddress',
                data: {},
                session: acquireRes.payload,
            });
            // await promise2;
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
