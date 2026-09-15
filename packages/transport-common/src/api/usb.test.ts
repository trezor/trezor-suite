import { createDeferred } from '@trezor/utils';

import * as ERRORS from '../errors';
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

    // Regression for QA Bug 1 (PR #30947): with usb 3.x, getDevices() returns a brand-new
    // UNOPENED object on every call. A re-enumeration that lands while a device is in use must
    // NOT swap its live opened object for a fresh unopened one, or the next transfer collapses
    // the session (this is what broke passphrase entry with two devices connected).
    it('enumerate() during an open session preserves the live opened device object', async () => {
        const deviceA = createStatefulDevice('123');
        // a genuinely different object instance for the same serial, as usb 3.x would return
        const deviceAFresh = createStatefulDevice('123');
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
    });

    it('enumerate() refreshes a closed (idle) device object', async () => {
        const deviceA = createStatefulDevice('123');
        const deviceAFresh = createStatefulDevice('123');
        let devicesToReturn: UsbDeviceLike[] = [deviceA];
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) }),
        });

        await api.enumerate();
        expect(deviceA.opened).toBe(false);

        devicesToReturn = [deviceAFresh];
        await api.enumerate();

        // an idle (never-opened) device is safe to refresh - avoids retaining a stale handle
        // for a device that may have been replugged
        expect(getTrackedDevice(api, '123')).toBe(deviceAFresh);
    });

    // Regression for QA Bug 2 (PR #30947): unplugging one device triggered a full re-enumerate
    // (ondisconnect without a serial number) that used to swap the OTHER, still-connected
    // opened device for a fresh unopened one, making it flicker/disconnect.
    it('ondisconnect without serialNumber does not disturb another opened device', async () => {
        const deviceA = createStatefulDevice('123');
        const deviceB = createStatefulDevice('456');
        let devicesToReturn: UsbDeviceLike[] = [deviceA, deviceB];
        const usbInterface = createUsbMock({
            getDevices: () => Promise.resolve(devicesToReturn),
        });
        const api = new UsbApi({ usbInterface });

        await api.enumerate();
        await api.openDevice(devicePath, { reset: false });
        expect(deviceA.opened).toBe(true);

        const listener = jest.fn();
        api.on('transport-interface-change', listener);
        api.listen();

        // usb 3.x returns fresh objects on the re-enumerate that the disconnect triggers
        devicesToReturn = [createStatefulDevice('123'), createStatefulDevice('456')];

        // a disconnect event whose device has no serial number takes the enumerate() branch
        await usbInterface.ondisconnect?.({
            device: createMockedDevice({ serialNumber: null }),
        });

        const tracked = getTrackedDevice(api, '123');
        expect(tracked).toBe(deviceA);
        expect(tracked?.opened).toBe(true);

        const lastDescriptors = listener.mock.calls.at(-1)?.[0] as { path: string }[];
        expect(lastDescriptors.some(d => d.path === '123')).toBe(true);
    });

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
        ['write', 'transferOut error: Disconnected'],
        ['read', 'transferIn error: Stall'],
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

        const throwingDevice = createMockedDevice();
        Object.defineProperty(throwingDevice, 'serialNumber', {
            get() {
                throw new Error('open error: device not found');
            },
            configurable: true,
        });

        expect(() => usbInterface.ondisconnect?.({ device: throwingDevice })).not.toThrow();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(enumerateSpy).toHaveBeenCalledTimes(1);
    });

    // Regression: bootloader paths (bootloader1, ...) are positional, so after one serial-less
    // device is unplugged the remaining one inherits its path. enumerate() must NOT keep the
    // disconnected device's opened handle under that reused path.
    it('enumerate() does not reuse an open device under a generated bootloader path', async () => {
        const bootA = createStatefulDevice('');
        const bootB = createStatefulDevice('');
        let devicesToReturn: UsbDeviceLike[] = [bootA];
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) }),
        });

        await api.enumerate();
        await api.openDevice(PathInternal('bootloader1'), { reset: false });
        expect(bootA.opened).toBe(true);

        // bootA unplugged, only bootB remains - it is now assigned 'bootloader1'
        devicesToReturn = [bootB];
        await api.enumerate();

        expect(getTrackedDevice(api, 'bootloader1')).toBe(bootB);
        expect(getTrackedDevice(api, 'bootloader1')).not.toBe(bootA);
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

    // Regression: formatDeviceForLog reads fallible 3.x getters (productName/serialNumber). It is
    // logged as the first statement of the fire-and-forget onconnect handler, so a throwing getter
    // must not reject the handler (which would be an unhandled rejection in the bridge worker).
    it('onconnect does not reject when a fallible getter throws during logging', async () => {
        const usbInterface = createUsbMock();
        const api = new UsbApi({
            usbInterface,
            // @ts-expect-error minimal logger so formatDeviceForLog is actually evaluated
            logger: { error: () => {}, debug: () => {} },
        });
        api.listen();

        const throwingDevice = createMockedDevice({ serialNumber: '999' });
        Object.defineProperty(throwingDevice, 'productName', {
            get() {
                throw new Error('open error: permission denied (os error 13)');
            },
            configurable: true,
        });

        await expect(usbInterface.onconnect?.({ device: throwingDevice })).resolves.toBeUndefined();
    });

    // Regression: usb 3.x `configuration` is a fallible getter (control-transfer I/O); reading it
    // in openInternal/isInterfaceClaimed must not reject openDevice/closeDevice (would leak the
    // session lock / crash the bridge worker).
    it('openDevice/closeDevice do not reject when the configuration getter throws', async () => {
        const device = createStatefulDevice('555');
        Object.defineProperty(device, 'configuration', {
            get() {
                throw new Error('configuration error: device is not configured');
            },
            configurable: true,
        });
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve([device]) }),
        });
        await api.enumerate();

        await expect(api.openDevice(PathInternal('555'), { reset: false })).resolves.toBeDefined();
        await expect(api.closeDevice(PathInternal('555'))).resolves.toBeDefined();
    });

    // Regression: usb 3.x reports opened===false until open() resolves, so a concurrent enumerate
    // during openDevice must not swap the device being opened for a fresh unopened object.
    it('enumerate() during openDevice does not orphan the device being opened', async () => {
        const openDfd = createDeferred<void>();
        const deviceA = createStatefulDevice('777');
        deviceA.open = jest.fn(() =>
            openDfd.promise.then(() => {
                deviceA.opened = true;
            }),
        );
        const deviceAFresh = createStatefulDevice('777');
        let devicesToReturn: UsbDeviceLike[] = [deviceA];
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) }),
        });
        await api.enumerate();

        // start opening but leave open() pending mid-flight
        const openPromise = api.openDevice(PathInternal('777'), { reset: false });

        // a concurrent enumerate hands back a fresh unopened object for the same path
        devicesToReturn = [deviceAFresh];
        await api.enumerate();

        expect(getTrackedDevice(api, '777')).toBe(deviceA);

        openDfd.resolve();
        await openPromise;

        expect(deviceA.opened).toBe(true);
        expect(getTrackedDevice(api, '777')).toBe(deviceA);
    });

    // Regression: devicesToDescriptors runs on the emit path (onconnect/ondisconnect). It must not
    // throw when a tracked device's fallible 3.x getters (serialNumber via id, productName via
    // model) throw, e.g. the device became unreadable/unplugged on Windows/Linux.
    it('descriptor emission does not throw when a tracked device getter throws', async () => {
        const deviceA = createStatefulDevice('123', { deviceVersionMajor: 2 });
        const usbInterface = createUsbMock({ getDevices: () => Promise.resolve([deviceA]) });
        const api = new UsbApi({ usbInterface });
        await api.enumerate();

        // the tracked device's descriptor getters now throw (unreadable / gone)
        Object.defineProperty(deviceA, 'serialNumber', {
            get() {
                throw new Error('open error: device not found');
            },
            configurable: true,
        });
        Object.defineProperty(deviceA, 'productName', {
            get() {
                throw new Error('open error: device not found');
            },
            configurable: true,
        });

        const listener = jest.fn();
        api.on('transport-interface-change', listener);
        api.listen();

        // connecting another device emits descriptors that include the throwing device
        await expect(
            usbInterface.onconnect?.({ device: createStatefulDevice('456') }),
        ).resolves.toBeUndefined();

        const descriptors = listener.mock.calls.at(-1)?.[0] as {
            path: string;
            id?: string | null;
        }[];
        // id is taken from the resolved path, not the throwing getter
        expect(descriptors.find(d => d.path === '123')?.id).toBe('123');
    });

    // Regression: loadSerialNumber (forceReadSerialOnConnect) force-reads the serial by opening the
    // device; it must leave the device CLOSED afterwards, because reconcileDevices keys on
    // !device.opened - a force-read that failed to close would corrupt the object-identity logic.
    it('loadSerialNumber force-reads the serial via open/close and leaves the device closed', async () => {
        let opened = false;
        let serial = '';
        const open = jest.fn(() => {
            opened = true;
            serial = 'DEADBEEF';

            return Promise.resolve();
        });
        const close = jest.fn(() => {
            opened = false;

            return Promise.resolve();
        });
        const device = createMockedDevice({ open, close });
        Object.defineProperty(device, 'opened', { get: () => opened, configurable: true });
        Object.defineProperty(device, 'serialNumber', { get: () => serial, configurable: true });

        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve([device]) }),
            forceReadSerialOnConnect: true,
        });
        await api.enumerate();

        expect(open).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(1);
        expect(device.opened).toBe(false);
        // the resolved serial becomes the tracked path
        expect(getTrackedDevice(api, 'DEADBEEF')).toBe(device);
    });

    // Regression: the onconnect dedup path must apply the same opening-device guard as
    // reconcileDevices - a duplicate connect event for a path that is mid-open() must not swap the
    // object openInternal captured (opened is still false during the open() await).
    it('onconnect during openDevice does not orphan the device being opened', async () => {
        const openDfd = createDeferred<void>();
        const deviceA = createStatefulDevice('123');
        deviceA.open = jest.fn(() =>
            openDfd.promise.then(() => {
                deviceA.opened = true;
            }),
        );
        const usbInterface = createUsbMock({ getDevices: () => Promise.resolve([deviceA]) });
        const api = new UsbApi({ usbInterface });
        await api.enumerate();
        api.listen();

        // start opening but leave open() pending (path 123 now in devicesOpening)
        const openPromise = api.openDevice(devicePath, { reset: false });

        // a duplicate connect event for the same serial arrives while open() is pending
        await usbInterface.onconnect?.({ device: createStatefulDevice('123') });

        expect(getTrackedDevice(api, '123')).toBe(deviceA);

        openDfd.resolve();
        await openPromise;
        expect(deviceA.opened).toBe(true);
        expect(getTrackedDevice(api, '123')).toBe(deviceA);
    });

    // Regression: a serial-less bootloader gets a positional path (bootloader1). Blanket-dropping
    // all bootloader paths breaks an ACTIVE bootloader (e.g. mid firmware update) that is merely
    // re-enumerated as a fresh object; preserve it when the stable handle proves it is the same
    // physical device (while still adopting a genuinely different device on positional renumbering).
    it('enumerate() preserves an active serial-less bootloader that is the same physical device', async () => {
        const bootA = createStatefulDevice('', { handle: 'H1' });
        const bootAFresh = createStatefulDevice('', { handle: 'H1' });
        let devicesToReturn: UsbDeviceLike[] = [bootA];
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve(devicesToReturn) }),
        });
        await api.enumerate();
        await api.openDevice(PathInternal('bootloader1'), { reset: false });
        expect(bootA.opened).toBe(true);

        // the same physical bootloader re-enumerated as a fresh unopened object (same handle)
        devicesToReturn = [bootAFresh];
        await api.enumerate();

        expect(getTrackedDevice(api, 'bootloader1')).toBe(bootA);
    });

    // Dual-distribution (usbVersion:'legacy' = usb 2.x): loadSerialNumber must read the serial via
    // the low-level getStringDescriptor (some drivers withhold it from the plain getter).
    it('legacy mode: loadSerialNumber reads the serial via getStringDescriptor', async () => {
        let serial = '';
        const getStringDescriptor = jest.fn(() => {
            serial = 'CAFE';

            return Promise.resolve('CAFE');
        });
        const device = createMockedDevice({
            getStringDescriptor,
            device: { deviceDescriptor: { iSerialNumber: 3 } },
        });
        Object.defineProperty(device, 'serialNumber', { get: () => serial, configurable: true });
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve([device]) }),
            forceReadSerialOnConnect: true,
            usbVersion: 'legacy',
        });

        await api.enumerate();

        expect(getStringDescriptor).toHaveBeenCalledTimes(1);
        expect(getStringDescriptor).toHaveBeenCalledWith(3);
        expect(getTrackedDevice(api, 'CAFE')).toBe(device);
    });

    // nusb mode (default) must NOT use the legacy getStringDescriptor path even if present.
    it('nusb mode: loadSerialNumber does not call getStringDescriptor', async () => {
        let serial = '';
        const getStringDescriptor = jest.fn(() => Promise.resolve('X'));
        const device = createMockedDevice({
            getStringDescriptor,
            device: { deviceDescriptor: { iSerialNumber: 3 } },
            open: () => {
                serial = 'NUSB';

                return Promise.resolve();
            },
        });
        Object.defineProperty(device, 'serialNumber', { get: () => serial, configurable: true });
        const api = new UsbApi({
            usbInterface: createUsbMock({ getDevices: () => Promise.resolve([device]) }),
            forceReadSerialOnConnect: true,
        });

        await api.enumerate();

        expect(getStringDescriptor).not.toHaveBeenCalled();
        expect(getTrackedDevice(api, 'NUSB')).toBe(device);
    });

    // Superset error strings: a usb 2.x libusb disconnect must still map to a disconnect.
    it('legacy mode: LIBUSB_ERROR_NO_DEVICE is classified as DEVICE_DISCONNECTED_DURING_ACTION', async () => {
        const api = new UsbApi({
            usbInterface: createUsbMock({
                getDevices: () =>
                    Promise.resolve([
                        createMockedDevice({
                            transferIn: () =>
                                Promise.reject(
                                    new Error('transferIn error: LIBUSB_ERROR_NO_DEVICE'),
                                ),
                        }),
                    ]),
            }),
            usbVersion: 'legacy',
        });
        await api.enumerate();

        const result = await api.read(devicePath, {});
        if (result.success) throw new Error('Unexpected success');
        expect(result.error.code).toBe(ERRORS.DEVICE_DISCONNECTED_DURING_ACTION);
    });
});
