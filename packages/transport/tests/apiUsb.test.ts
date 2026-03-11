import { createDeferred } from '@trezor/utils';

import { UsbApi } from '../src/api/usb';

const createTransferInResult = (size = 64) =>
    ({
        status: 'ok',
        data: new DataView(new Uint8Array(size).buffer),
    }) as USBInTransferResult;

const createTransferOutResult = (bytesWritten = 64) =>
    ({
        status: 'ok',
        bytesWritten,
    }) as USBOutTransferResult;

// create devices otherwise returned from navigator.usb.getDevices
const createMockedDevice = (optional: Partial<USBDevice> & Record<string, unknown> = {}) =>
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
    }) as USBDevice;

// mock of navigator.usb
const createUsbMock = (optional: Partial<USB> = {}) =>
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
        const promise = api.read('123', abortController.signal);
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error).toContain('Aborted by signal');
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
        const promise = api.write('123', Buffer.alloc(api.chunkSize), abortController.signal);
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error).toContain('Aborted by signal');
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
        const promise = api.openDevice('123', { reset: true, signal: abortController.signal });
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

        // @ts-expect-error
        api.usbInterface.onconnect({
            device: {
                ...createMockedDevice(),
                serialNumber: undefined,
                // @ts-expect-error
                device: {
                    deviceDescriptor: {
                        iSerialNumber: 'foo',
                    },
                },
                getStringDescriptor: () => new Promise(() => {}),
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
            await api.write('123', Buffer.alloc(0), abortController.signal);
            await api.read('123', abortController.signal);
        }

        // this should not trigger onAbort (device.reset)
        abortController.abort();
        await api.write('123', Buffer.alloc(0), abortController.signal);

        expect(reset).toHaveBeenCalledTimes(0);
    });

    it.each(['5e81a7', undefined, ''])('disconnect with serialNumber: %p', async serialNumber => {
        let enumerateCounter = 0;
        const enumerateDfd = createDeferred<USBDevice[]>();
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
        } as any); // partial WebUSB event

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
