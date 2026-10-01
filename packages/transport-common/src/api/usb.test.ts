import { createDeferred } from '@trezor/utils';

import * as ERRORS from '../errors';
import { PathInternal } from '../types';
import { UsbApi } from './usb';
import { UsbApiLegacy } from './usbLegacy';
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

// a device whose `opened` flag tracks open()/close(), plus a valid configuration so it can be
// acquired via openDevice(); used to model usb 3.x handing out a fresh unopened object per
// getDevices() while a previously enumerated object is still in use.
const createStatefulDevice = (
    serialNumber: string,
    optional: Partial<UsbDeviceLike> & Record<string, unknown> = {},
) => {
    const device = {
        vendorId: 0x1209,
        productId: 0x53c1,
        serialNumber,
        productName: 'Trezor',
        manufacturerName: 'Trezor',
        opened: false,
        // CONFIGURATION_ID = 1, INTERFACE_ID = 0
        configuration: { configurationValue: 1, interfaces: [] },
        open: jest.fn(() => {
            device.opened = true;

            return Promise.resolve();
        }),
        close: jest.fn(() => {
            device.opened = false;

            return Promise.resolve();
        }),
        selectConfiguration: () => Promise.resolve(),
        claimInterface: () => Promise.resolve(),
        releaseInterface: () => Promise.resolve(),
        reset: () => Promise.resolve(),
        transferOut: jest.fn(() => Promise.resolve(createTransferOutResult())),
        transferIn: jest.fn(() => Promise.resolve(createTransferInResult())),
        ...optional,
    } as unknown as UsbDeviceLike;

    return device;
};

// models a usb 3.x fallible getter: reading it opens the device, which fails for a gone or
// unreadable device
const throwOnRead = <T extends UsbDeviceLike>(device: T, property: keyof UsbDeviceLike) => {
    Object.defineProperty(device, property, {
        get() {
            throw new Error('open error: device not found');
        },
        configurable: true,
    });

    return device;
};

// reach into the tracked device list to assert object identity is preserved across enumerations
const getTrackedDevice = (api: UsbApi, path: string) =>
    (api as unknown as { devices: { path: string; device: UsbDeviceLike }[] }).devices.find(
        d => d.path === path,
    )?.device;

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

    const devicePath = PathInternal('123');

    type ApiParams = ConstructorParameters<typeof UsbApi>[0];

    // The pre-migration tests run against both classes: the frozen usb 2.x copy (UsbApiLegacy)
    // must keep passing the behaviour spec of the implementation it was copied from. The two only
    // differ in how a pending serial read is modelled (usb 2.x reads a string descriptor through
    // the libusb handle, usb 3.x reads the getter after open()).
    describe.each([
        {
            name: 'UsbApi',
            createApi: (params: ApiParams) => new UsbApi(params),
            // never resolves, so loadSerialNumber is pending when dispose() aborts
            pendingSerialRead: { open: () => new Promise<void>(() => {}) },
        },
        {
            name: 'UsbApiLegacy',
            createApi: (params: ApiParams) => new UsbApiLegacy(params),
            pendingSerialRead: {
                device: { deviceDescriptor: { iSerialNumber: 3 } },
                getStringDescriptor: () => new Promise<string>(() => {}),
            },
        },
    ])('$name', ({ createApi, pendingSerialRead }) => {
        it('read aborted', async () => {
            const reset = jest.fn(() => Promise.resolve());
            const api = createApi({
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
            const api = createApi({
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
            const api = createApi({
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
            const api = createApi({
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
            const api = createApi({
                usbInterface: createUsbMock({
                    getDevices: () =>
                        new Promise(resolve =>
                            setTimeout(() => resolve([createMockedDevice()]), 100),
                        ),
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
                    ...pendingSerialRead,
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
            const api = createApi({
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

        it.each(['5e81a7', undefined, ''])(
            'disconnect with serialNumber: %p',
            async serialNumber => {
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
                const api = createApi({
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
            },
        );
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

    // Regression for QA Bug 1 (PR #30947): with usb 3.x, getDevices() returns a brand-new
    // UNOPENED object on every call. A re-enumeration that lands while a device is in use must
    // NOT swap its live opened object for a fresh unopened one, or the next transfer collapses
    // the session (this is what broke passphrase entry with two devices connected). Once the
    // device is closed again it is safe to refresh, so a replugged device does not keep a stale
    // object around. Real nusb exposes a stable handle, navigator.usb none - both must behave.
    it.each([
        ['without a handle (navigator.usb)', {}],
        ['with a stable nusb handle', { handle: 'H1' }],
    ])(
        'enumerate() preserves an in-use device object and refreshes a closed one %s',
        async (_, extra) => {
            const deviceA = createStatefulDevice('123', extra);
            // a genuinely different object instance for the same serial, as usb 3.x would return
            const deviceAFresh = createStatefulDevice('123', extra);
            let devicesToReturn: UsbDeviceLike[] = [deviceA];
            const api = new UsbApi({
                usbInterface: createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) }),
            });

            await api.enumerate();
            const openResult = await api.openDevice(devicePath, { reset: false });
            expect(openResult.success).toBe(true);
            expect(deviceA.opened).toBe(true);

            // usb 3.x hands out a fresh object (+ a second device to model realistic churn)
            devicesToReturn = [deviceAFresh, createStatefulDevice('456')];
            await api.enumerate();

            const tracked = getTrackedDevice(api, '123');
            expect(tracked).toBe(deviceA);
            expect(tracked?.opened).toBe(true);

            // and the in-flight object is the one that actually serves the next read
            await api.read(devicePath, {});
            expect(deviceA.transferIn).toHaveBeenCalledTimes(1);
            expect(deviceAFresh.transferIn).not.toHaveBeenCalled();

            // closed again: the idle entry is refreshed with the fresh object
            await api.closeDevice(devicePath);
            expect(deviceA.opened).toBe(false);
            await api.enumerate();
            expect(getTrackedDevice(api, '123')).toBe(deviceAFresh);
        },
    );

    const runReadWrite = async (op: string, message: string) => {
        const reject = () => Promise.reject(new Error(message));
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({ transferIn: reject, transferOut: reject }),
                    ]),
            }),
        });
        await api.enumerate();

        return op === 'read'
            ? api.read(devicePath, {})
            : api.write(devicePath, Buffer.alloc(0), {});
    };

    // Regression: usb 3.x (nusb) formats transfer errors with Rust Debug, so a failed transfer
    // arrives as the bare TransferError variant name, e.g. "transferIn error: Disconnected". The
    // variants that the 2.x transport treated as a disconnect (NO_DEVICE/PIPE/IO/OTHER) must map
    // to DEVICE_DISCONNECTED_DURING_ACTION, not UNEXPECTED_ERROR (which suppresses recovery).
    it.each([
        ['read', 'transferIn error: Disconnected'],
        ['write', 'transferOut error: Stall'],
        ['read', 'transferIn error: Fault'],
        ['read', 'transferIn error: Unknown(5)'],
        ['read', 'The device was disconnected.'],
    ])(
        '%s transfer error (%p) is classified as DEVICE_DISCONNECTED_DURING_ACTION',
        async (op, message) => {
            const result = await runReadWrite(op, message);
            if (result.success) throw new Error('Unexpected success');
            expect(result.error.code).toBe(ERRORS.DEVICE_DISCONNECTED_DURING_ACTION);
        },
    );

    // Cancelled (our own abort), InvalidArgument (a programming error) and endpoint-not-found (an
    // unclaimed interface) must NOT be masked as disconnects.
    it.each([
        ['read', 'transferIn error: Cancelled'],
        ['read', 'transferIn error: InvalidArgument'],
        ['read', 'transferIn error: endpoint not found'],
        // an unrelated error that merely contains the word Unknown is not a nusb transfer variant
        ['read', 'Unknown error: something went wrong'],
    ])('%s transfer error (%p) is NOT treated as a disconnect', async (op, message) => {
        const result = await runReadWrite(op, message);
        if (result.success) throw new Error('Unexpected success');
        expect(result.error.code).toBe(ERRORS.UNEXPECTED_ERROR);
    });

    // Regression: in usb 3.x serialNumber is a fallible getter that opens the device on access;
    // reading it for a just-unplugged device throws. ondisconnect must not let that crash the
    // bridge - it should fall back to re-enumeration.
    it('ondisconnect does not throw when the serialNumber getter throws', async () => {
        const usbInterface = createUsbMock();
        const api = new UsbApi({ usbInterface });
        await api.enumerate();

        const enumerateSpy = jest.spyOn(api, 'enumerate');
        api.listen();

        const throwingDevice = throwOnRead(createMockedDevice(), 'serialNumber');

        expect(() => usbInterface.ondisconnect?.({ device: throwingDevice })).not.toThrow();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(enumerateSpy).toHaveBeenCalledTimes(1);
    });

    // Regression: serial-less bootloaders get positional paths (bootloader1, ...). After one is
    // unplugged the remaining one inherits its path, so an opened entry must not be kept under a
    // path that now belongs to a DIFFERENT device - but an ACTIVE bootloader (e.g. mid firmware
    // update) that is merely re-enumerated as a fresh object must stay, which only the stable
    // nusb handle can tell apart.
    it.each([
        ['a different device took the path', {}, false],
        ['the same physical device was re-enumerated (same nusb handle)', { handle: 'H1' }, true],
    ])('enumerate() under a reused bootloader path: %s', async (_, extra, preserved) => {
        const bootA = createStatefulDevice('', extra);
        const bootNext = createStatefulDevice('', extra);
        let devicesToReturn: UsbDeviceLike[] = [bootA];
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) }),
        });
        await api.enumerate();
        await api.openDevice(PathInternal('bootloader1'), { reset: false });
        expect(bootA.opened).toBe(true);

        devicesToReturn = [bootNext];
        await api.enumerate();

        expect(getTrackedDevice(api, 'bootloader1')).toBe(preserved ? bootA : bootNext);
    });

    // Regression: usb 3.x (nusb) reports EACCES/EPERM as "open error: permission denied (...)"
    // instead of a libusb code. It must still map to LIBUSB_ERROR_ACCESS so the Linux udev-rules
    // installation tip keeps showing.
    it('openDevice maps a nusb permission error to LIBUSB_ERROR_ACCESS', async () => {
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            open: () =>
                                Promise.reject(
                                    new Error('open error: permission denied (os error 13)'),
                                ),
                        }),
                    ]),
            }),
        });
        await api.enumerate();

        const result = await api.openDevice(devicePath, { reset: false });
        if (result.success) throw new Error('Unexpected success');
        expect(result.error.code).toBe(ERRORS.LIBUSB_ERROR_ACCESS);
    });

    // Regression: the usb 3.x productName/serialNumber getters are fallible and are read on the
    // fire-and-forget emit path - formatDeviceForLog as the first statement of onconnect, and
    // devicesToDescriptors for every tracked device - so a throw there would be an unhandled
    // rejection in the bridge worker. Neither the connecting nor an already-tracked (now
    // unreadable) device may bring the handler down, and the descriptor id comes from the
    // resolved path rather than from the throwing getter.
    it('onconnect does not reject when fallible getters throw on the emit path', async () => {
        const tracked = createStatefulDevice('123', { deviceVersionMajor: 2 });
        const usbInterface = createUsbMock({ getDevices: () => Promise.resolve([tracked]) });
        const api = new UsbApi({
            usbInterface,
            // @ts-expect-error minimal logger so formatDeviceForLog is actually evaluated
            logger: { error: () => {}, debug: () => {} },
        });
        await api.enumerate();
        // the tracked device became unreadable (unplugged / permission lost) after enumeration
        throwOnRead(tracked, 'serialNumber');
        throwOnRead(tracked, 'productName');

        const listener = jest.fn();
        api.on('transport-interface-change', listener);
        api.listen();

        const connecting = throwOnRead(createStatefulDevice('456'), 'productName');
        await expect(usbInterface.onconnect?.({ device: connecting })).resolves.toBeUndefined();

        const descriptors = listener.mock.calls.at(-1)?.[0] as {
            path: string;
            id?: string | null;
        }[];
        expect(descriptors.map(d => d.path).sort()).toEqual(['123', '456']);
        expect(descriptors.find(d => d.path === '123')?.id).toBe('123');
    });

    // Regression: usb 3.x `configuration` is a fallible getter (control-transfer I/O); reading it
    // in openInternal/isInterfaceClaimed must not reject openDevice/closeDevice (would leak the
    // session lock / crash the bridge worker).
    it('openDevice/closeDevice do not reject when the configuration getter throws', async () => {
        const device = throwOnRead(createStatefulDevice('555'), 'configuration');
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve([device]) }),
        });
        await api.enumerate();

        await expect(api.openDevice(PathInternal('555'), { reset: false })).resolves.toBeDefined();
        await expect(api.closeDevice(PathInternal('555'))).resolves.toBeDefined();
    });

    // Regression: usb 3.x reports opened===false until open() resolves, so neither a concurrent
    // enumerate nor a duplicate connect event may swap the device being opened for a fresh
    // unopened object - that would orphan the handle openInternal already captured.
    it.each([
        ['a concurrent enumerate()', false],
        ['a duplicate connect event', true],
    ])('%s during openDevice does not orphan the device being opened', async (_, viaConnect) => {
        const openDfd = createDeferred<void>();
        const deviceA = createStatefulDevice('777');
        deviceA.open = jest.fn(() =>
            openDfd.promise.then(() => {
                deviceA.opened = true;
            }),
        );
        const deviceAFresh = createStatefulDevice('777');
        let devicesToReturn: UsbDeviceLike[] = [deviceA];
        const usbInterface = createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) });
        const api = new UsbApi({ usbInterface });
        await api.enumerate();
        api.listen();

        // start opening but leave open() pending mid-flight (path 777 is now in devicesOpening)
        const openPromise = api.openDevice(PathInternal('777'), { reset: false });

        // a fresh unopened object for the same path arrives while open() is pending
        devicesToReturn = [deviceAFresh];
        if (viaConnect) {
            await usbInterface.onconnect?.({ device: deviceAFresh });
        } else {
            await api.enumerate();
        }

        expect(getTrackedDevice(api, '777')).toBe(deviceA);

        openDfd.resolve();
        await openPromise;

        expect(deviceA.opened).toBe(true);
        expect(getTrackedDevice(api, '777')).toBe(deviceA);
    });

    // Regression: loadSerialNumber (forceReadSerialOnConnect) force-reads the serial by opening
    // the device and must leave it CLOSED afterwards - also when the usb 3.x serialNumber getter
    // throws after open() (it is read for the debug log) - because reconcileDevices keys on
    // !device.opened and would otherwise treat this mere probe as an in-use device.
    it.each([
        ['succeeds', 'DEADBEEF', 'DEADBEEF'],
        ['throws after open()', null, 'bootloader1'],
    ])(
        'loadSerialNumber leaves the device closed when the serial read %s',
        async (_, serial, path) => {
            let opened = false;
            let serialAvailable = false;
            const open = jest.fn(() => {
                opened = true;
                serialAvailable = true;

                return Promise.resolve();
            });
            const close = jest.fn(() => {
                opened = false;

                return Promise.resolve();
            });
            const device = createMockedDevice({ open, close });
            Object.defineProperty(device, 'opened', { get: () => opened, configurable: true });
            Object.defineProperty(device, 'serialNumber', {
                // empty until the device was opened (so the forced read triggers); then the serial,
                // or a throw for a device that became unreadable
                get() {
                    if (!serialAvailable) return '';
                    if (serial === null) throw new Error('open error: device not found');

                    return serial;
                },
                configurable: true,
            });
            const api = new UsbApi({
                usbInterface: createUsbMock({ getDevices: () => Promise.resolve([device]) }),
                forceReadSerialOnConnect: true,
            });

            const result = await api.enumerate();

            expect(result.success).toBe(true);
            expect(open).toHaveBeenCalledTimes(1);
            expect(close).toHaveBeenCalledTimes(1);
            expect(device.opened).toBe(false);
            expect(getTrackedDevice(api, path)).toBe(device);
        },
    );

    // Regression (#2): one unreadable device must not reject createDevices' Promise.all and drop
    // the readable ones with it - whether the usb 3.x serialNumber getter throws or the forced
    // serial read (loadSerialNumber) cannot open it. It is isolated to a positional path instead.
    it.each([
        [
            'serialNumber getter throws',
            () => throwOnRead(createMockedDevice(), 'serialNumber'),
            false,
        ],
        [
            'forced serial read fails',
            () =>
                createMockedDevice({
                    serialNumber: '', // empty -> triggers the forced serial read
                    open: () => Promise.reject(new Error('open error: permission denied')),
                }),
            true,
        ],
    ])(
        'enumerate() isolates a device whose %s from the readable ones',
        async (_, createUnreadable, forceReadSerialOnConnect) => {
            const readable = createMockedDevice({ serialNumber: 'GOOD' });
            const api = new UsbApi({
                usbInterface: createUsbMock({
                    getDevices: () => Promise.resolve([readable, createUnreadable()]),
                }),
                forceReadSerialOnConnect,
            });

            const result = await api.enumerate();

            expect(result.success).toBe(true);
            expect(getTrackedDevice(api, 'GOOD')).toBe(readable);
            if (result.success) {
                expect(result.payload.map(d => d.path).sort()).toEqual(['GOOD', 'bootloader1']);
            }
        },
    );

    // With a change listener (bridge core, transport.listen()) the drop is announced through the
    // event, so the fresh object comes back in the SAME enumerate. Nothing else re-enumerates a
    // physically-present device on the bridge, so it must not depend on a later enumerate.
    it('enumerate() re-adds a replugged device in the same call once the drop was announced', async () => {
        const deviceA = createStatefulDevice('123', { handle: 'H1' });
        let devicesToReturn: UsbDeviceLike[] = [deviceA];
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) }),
        });
        await api.enumerate();
        await api.openDevice(devicePath, { reset: false });

        const listener = jest.fn();
        api.on('transport-interface-change', listener);

        const deviceAReplugged = createStatefulDevice('123', { handle: 'H2' });
        devicesToReturn = [deviceAReplugged];
        const result = await api.enumerate();

        // the only emit is the drop; the re-add travels in the returned list
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith([]);
        expect(result.success && result.payload.map(d => d.path)).toEqual(['123']);
        expect(getTrackedDevice(api, '123')).toBe(deviceAReplugged);
    });

    // Regression (#3, onconnect): a reconnect event for an already-tracked opened device that
    // carries a DIFFERENT nusb handle (fast replug, connect-before-disconnect) must first DROP the
    // dead tracked object (first emit -> sessions layer invalidates the stale session) and then
    // RE-ADD the fresh object (second emit) so the physically-present device is not lost.
    it('onconnect on a changed nusb handle (replug) drops then re-adds the fresh object (two emits)', async () => {
        const deviceA = createStatefulDevice('123', { handle: 'H1' });
        const usbInterface = createUsbMock({ getDevices: () => Promise.resolve([deviceA]) });
        const api = new UsbApi({ usbInterface });
        await api.enumerate();
        await api.openDevice(devicePath, { reset: false });
        expect(deviceA.opened).toBe(true);

        const listener = jest.fn();
        api.on('transport-interface-change', listener);
        api.listen();

        const deviceAReplugged = createStatefulDevice('123', { handle: 'H2' });
        await usbInterface.onconnect?.({ device: deviceAReplugged });

        // the live replugged device stays visible as the fresh live-handle object (not lost)
        expect(getTrackedDevice(api, '123')).toBe(deviceAReplugged);
        // two emits: first WITHOUT '123' (invalidates the stale session), then WITH the fresh '123'
        expect(listener).toHaveBeenCalledTimes(2);
        const firstEmit = listener.mock.calls[0]?.[0] as { path: string }[];
        const secondEmit = listener.mock.calls[1]?.[0] as { path: string }[];
        expect(firstEmit.some(d => d.path === '123')).toBe(false);
        expect(secondEmit.some(d => d.path === '123')).toBe(true);
    });

    // Regression (#3, ondisconnect): after a connect-before-disconnect replug the tracked entry
    // already holds the NEWER handle; a late disconnect for the OLD handle must NOT remove the live
    // newer instance (it is a different physical connection).
    it('ondisconnect ignores a late disconnect for a superseded (replugged) handle', async () => {
        const deviceA = createStatefulDevice('123', { handle: 'H1' });
        const usbInterface = createUsbMock({ getDevices: () => Promise.resolve([deviceA]) });
        const api = new UsbApi({ usbInterface });
        await api.enumerate();
        await api.openDevice(devicePath, { reset: false });
        api.listen();

        // replug arrives connect-first: '123' now tracks the newer handle H2
        const deviceAReplugged = createStatefulDevice('123', { handle: 'H2' });
        await usbInterface.onconnect?.({ device: deviceAReplugged });
        expect(getTrackedDevice(api, '123')).toBe(deviceAReplugged);

        // the late disconnect for the OLD handle H1 must NOT remove the live newer instance
        await usbInterface.ondisconnect?.({
            device: createStatefulDevice('123', { handle: 'H1' }),
        });
        expect(getTrackedDevice(api, '123')).toBe(deviceAReplugged);
    });
});
