import { createDeferred } from '@trezor/utils';

import { PathInternal } from '../types';
import { UsbApi } from './usb';
import type {
    UsbDeviceLike,
    UsbInTransferResultLike,
    UsbInterfaceApi,
    UsbOutTransferResultLike,
} from '../types/usbInterface';

const createTransferInResult = (size = 64) =>
    ({
        status: 'ok',
        data: new DataView(new Uint8Array(size).buffer),
    }) as UsbInTransferResultLike;

const createTransferOutResult = (bytesWritten = 64) =>
    ({
        status: 'ok',
        bytesWritten,
    }) as UsbOutTransferResultLike;

// create devices otherwise returned from navigator.usb.getDevices
const createMockedDevice = (optional: Partial<UsbDeviceLike> & Record<string, unknown> = {}) =>
    ({
        vendorId: 0x1209,
        productId: 0x53c1,
        serialNumber: '123',
        productName: 'Trezor',
        manufacturerName: 'Trezor',
        opened: false,
        open: () => Promise.resolve(),
        selectConfiguration: () => Promise.resolve(),
        claimInterface: () => Promise.resolve(),
        transferOut: () => Promise.resolve(createTransferOutResult()),
        transferIn: () => Promise.resolve(createTransferInResult()),
        releaseInterface: () => Promise.resolve(),
        close: () => Promise.resolve(),
        ...optional,
    }) as UsbDeviceLike;

// mock of navigator.usb
const createUsbMock = (optional: Partial<UsbInterfaceApi> = {}) =>
    ({
        getDevices: () => Promise.resolve([createMockedDevice()]),
        onconnect: null,
        ondisconnect: null,
        ...optional,
    }) as unknown as UsbApi['usbInterface'];

describe('api/usb', () => {
    beforeEach(() => {
        jest.useRealTimers();
    });

    afterEach(() => {});

    afterAll(async () => {});

    const devicePath = PathInternal('123');

    it('read aborted', async () => {
        const reset = jest.fn(() => Promise.resolve());
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            reset,
                            transferIn: () =>
                                new Promise(resolve =>
                                    setTimeout(
                                        () => resolve(createTransferInResult(api.chunkSize)),
                                        100,
                                    ),
                                ),
                        }),
                    ]),
            }),
        });

        const abortController = new AbortController();
        await api.enumerate(abortController.signal);
        const promise = api.read(devicePath, { signal: abortController.signal });
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error.code).toContain('Aborted by signal');
        expect(reset).toHaveBeenCalledTimes(1);
    });

    it('write aborted', async () => {
        const reset = jest.fn(() => Promise.resolve());
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            reset,
                            transferOut: () =>
                                new Promise(resolve =>
                                    setTimeout(() => resolve(createTransferOutResult()), 100),
                                ),
                        }),
                    ]),
            }),
        });

        const abortController = new AbortController();
        await api.enumerate(abortController.signal);
        const promise = api.write(devicePath, Buffer.alloc(api.chunkSize), {
            signal: abortController.signal,
        });
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error.code).toContain('Aborted by signal');
        expect(reset).toHaveBeenCalledTimes(1);
    });

    it('enumerate aborted', async () => {
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () => new Promise(resolve => setTimeout(() => resolve([]), 100)),
            }),
        });

        const abortController = new AbortController();
        const promise = api.enumerate(abortController.signal);
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error.message).toContain('Aborted by signal');
    });

    it('openDevice aborted', async () => {
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            open: () =>
                                new Promise<void>(resolve => setTimeout(() => resolve(), 100)),
                        }),
                    ]),
            }),
        });

        const abortController = new AbortController();
        await api.enumerate(abortController.signal);
        const promise = api.openDevice(devicePath, {
            reset: true,
            signal: abortController.signal,
        });
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error.message).toContain('Aborted by signal');
    });

    it('device connection event induced chain of calls aborted', async () => {
        const logErrorSpy = jest.fn();
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    new Promise(resolve => setTimeout(() => resolve([createMockedDevice()]), 100)),
            }),
            forceReadSerialOnConnect: true,
            // @ts-expect-error
            logger: {
                error: logErrorSpy,
                debug: () => {},
            },
        });

        api.listen();

        // @ts-expect-error: onconnect is possibly null
        api.usbInterface.onconnect({
            device: {
                ...createMockedDevice(),
                serialNumber: null,
                // never resolves, so loadSerialNumber is pending when dispose() aborts
                open: () => new Promise(() => {}),
            },
        });

        api.dispose();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(logErrorSpy).toHaveBeenNthCalledWith(
            1,
            'usb: loadSerialNumber error: Aborted by signal',
        );

        expect(logErrorSpy).toHaveBeenNthCalledWith(
            2,
            'usb: createDevices error: Aborted by signal',
        );
    });

    it('read/write +10 chunks', async () => {
        const reset = jest.fn(() => Promise.resolve());
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            reset,
                            transferIn: () => Promise.resolve(createTransferInResult()),
                            transferOut: () => Promise.resolve(createTransferOutResult()),
                        }),
                    ]),
            }),
        });

        const abortController = new AbortController();
        await api.enumerate(abortController.signal);
        for (let i = 0; i < 11; i++) {
            await api.write(devicePath, Buffer.alloc(0), {
                signal: abortController.signal,
            });
            await api.read(devicePath, { signal: abortController.signal });
        }

        // this should not trigger onAbort (device.reset)
        abortController.abort();
        await api.write(devicePath, Buffer.alloc(0), { signal: abortController.signal });

        expect(reset).toHaveBeenCalledTimes(0);
    });

    // usb 3.x defaults every transfer to a 1s timeout; reads/writes that wait for user
    // interaction (button, PIN, THP pairing) must pass an effectively-infinite timeout so
    // they are not cancelled prematurely.
    it('read/write pass a long transfer timeout, not the usb 3.x 1s default', async () => {
        const transferIn = jest.fn((_endpoint: number, _length: number, _timeout?: number) =>
            Promise.resolve(createTransferInResult()),
        );
        const transferOut = jest.fn((_endpoint: number, _data: unknown, _timeout?: number) =>
            Promise.resolve(createTransferOutResult()),
        );
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([createMockedDevice({ transferIn, transferOut })]),
            }),
        });

        await api.enumerate();
        await api.write(devicePath, Buffer.alloc(0), {});
        await api.read(devicePath, {});

        const writeTimeout = transferOut.mock.calls[0]?.[2];
        const readTimeout = transferIn.mock.calls[0]?.[2];
        expect(writeTimeout).toBeGreaterThan(60_000);
        expect(readTimeout).toBeGreaterThan(60_000);
    });

    it.each(['5e81a7', undefined, ''])('disconnect with serialNumber: %p', async serialNumber => {
        let enumerateCounter = 0;
        const enumerateDfd = createDeferred<UsbDeviceLike[]>();
        const usbInterface = createUsbMock({
            getDevices: () => {
                if (enumerateCounter > 0) {
                    return enumerateDfd.promise;
                }
                enumerateCounter++;

                return Promise.resolve([createMockedDevice({ serialNumber })]);
            },
        });
        const api = new UsbApi({
            usbInterface,
        });
        await api.enumerate();

        const enumerateSpy = jest.spyOn(api, 'enumerate');
        const listener = jest.fn();

        api.on('transport-interface-change', listener);
        api.listen();

        // emit change
        const disconnectPromise = usbInterface.ondisconnect?.({
            device: createMockedDevice({ serialNumber }),
        }); // partial WebUSB event

        if (!serialNumber) {
            expect(enumerateSpy).toHaveBeenCalledTimes(1);
            expect(listener).not.toHaveBeenCalled();
        }

        enumerateDfd.resolve([]);
        await disconnectPromise;

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith([]);
    });
});
