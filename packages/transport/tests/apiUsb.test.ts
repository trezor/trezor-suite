import { UsbApi } from '../src/api/usb';

// create devices otherwise returned from navigator.usb.getDevices
const createMockedDevice = (optional = {}) => ({
    vendorId: 0x1209,
    productId: 0x53c1,
    serialNumber: '123',
    open: () => Promise.resolve(),
    selectConfiguration: () => Promise.resolve(),
    claimInterface: () => Promise.resolve(),
    transferOut: () => Promise.resolve({ status: 'ok' }),
    transferIn: () => Promise.resolve({ data: Buffer.alloc(64) }),
    releaseInterface: () => Promise.resolve(),
    close: () => Promise.resolve(),
    ...optional,
});

// mock of navigator.usb
const createUsbMock = (optional = {}) =>
    ({
        getDevices: () => Promise.resolve([createMockedDevice()]),
        ...optional,
    }) as unknown as UsbApi['usbInterface'];

describe('api/usb', () => {
    beforeEach(() => {
        jest.useRealTimers();
    });

    afterEach(() => {});

    afterAll(async () => {});

    it('read aborted', async () => {
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            transferIn: () =>
                                new Promise(resolve =>
                                    setTimeout(
                                        () => resolve({ data: Buffer.alloc(api.chunkSize) }),
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
    });

    it('write aborted', async () => {
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            transferOut: () =>
                                new Promise(resolve =>
                                    setTimeout(() => resolve({ status: 'ok' }), 100),
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
        expect(result.message).toContain('Aborted by signal');
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
        expect(result.message).toContain('Aborted by signal');
    });

    it('openDevice aborted', async () => {
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            open: () =>
                                new Promise(resolve =>
                                    setTimeout(() => resolve({ status: 'ok' }), 100),
                                ),
                        }),
                    ]),
            }),
        });

        const abortController = new AbortController();
        await api.enumerate(abortController.signal);
        const promise = api.openDevice('123', true, abortController.signal);
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.message).toContain('Aborted by signal');
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
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            transferIn: () =>
                                Promise.resolve({ data: Buffer.alloc(api.chunkSize) }),
                            transferOut: () => new Promise(resolve => resolve({ status: 'ok' })),
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
        // this test doesn't expect any particular result. only checks EventTarget memory leak
    });
});
