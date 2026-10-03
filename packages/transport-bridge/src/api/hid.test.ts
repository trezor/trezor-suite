import type { Device as NodeHidDevice } from 'node-hid';

import { DEVICE_TYPE, TRANSPORT_ERROR as ERRORS, PathInternal } from '@trezor/transport-common';
import { createDeferred } from '@trezor/utils';

import { HidApi, type NodeHid } from './hid';

const SYSTEM_PATH = 'IOService:/AppleACPIPlatformExpert/XHC1@14/Trezor@14100000';

const mockNodeHidDevice = (device: Partial<NodeHidDevice> = {}): NodeHidDevice => ({
    vendorId: 0x534c,
    productId: 0x0001,
    path: SYSTEM_PATH,
    serialNumber: 'SERIAL-NUMBER',
    release: 0x0100,
    interface: 0,
    usagePage: 0xff00,
    ...device,
});

const mockHandle = () => ({
    read: jest.fn<Promise<Buffer | undefined>, [number?]>().mockResolvedValue(undefined),
    write: jest.fn((values: Buffer) => Promise.resolve(values.length)),
    close: jest.fn(() => Promise.resolve()),
});

type SetupParams = {
    devices?: NodeHidDevice[];
    platform?: NodeJS.Platform;
    handle?: ReturnType<typeof mockHandle>;
};

const setup = async ({
    devices = [mockNodeHidDevice()],
    platform = 'darwin',
    handle = mockHandle(),
}: SetupParams = {}) => {
    const nodeHid = {
        devicesAsync: jest.fn(() => Promise.resolve(devices)),
        HIDAsync: { open: jest.fn(() => Promise.resolve(handle)) },
    } satisfies NodeHid;
    const api = new HidApi({ nodeHid, platform });
    const enumeration = await api.enumerate();
    const path = enumeration.success ? enumeration.payload[0]?.path : undefined;

    return { api, nodeHid, handle, enumeration, path: path ?? PathInternal('missing') };
};

const PACKET = Buffer.from('3f232300010000000000', 'hex');

describe(HidApi.name, () => {
    describe('enumerate', () => {
        it('lists the wire interface as a HID Trezor One without exposing the system path or serial number', async () => {
            const { enumeration } = await setup();

            expect(enumeration).toEqual({
                success: true,
                payload: [
                    {
                        path: expect.stringMatching(/^hid-[0-9a-f]{64}$/),
                        type: DEVICE_TYPE.TypeT1Hid,
                        vendor: 0x534c,
                        product: 0x0001,
                        apiType: 'usb',
                        id: null,
                    },
                ],
            });
            expect(JSON.stringify(enumeration)).not.toContain('SERIAL-NUMBER');
            expect(JSON.stringify(enumeration)).not.toContain('IOService');
        });

        it('skips the U2F and debug link interfaces', async () => {
            const { enumeration } = await setup({
                devices: [
                    mockNodeHidDevice({ path: 'u2f', interface: 1, usagePage: 0xf1d0 }),
                    mockNodeHidDevice({ path: 'debug', interface: 2, usagePage: 0xff01 }),
                ],
            });

            expect(enumeration).toEqual({ success: true, payload: [] });
        });

        it('recognizes the wire interface by usage page when the interface number is unknown', async () => {
            const { enumeration } = await setup({
                devices: [mockNodeHidDevice({ interface: -1 })],
            });

            expect(enumeration.success && enumeration.payload).toHaveLength(1);
        });

        it('reports a failing backend without the original error message', async () => {
            const nodeHid = {
                devicesAsync: jest.fn(() =>
                    Promise.reject(new Error(`cannot load ${SYSTEM_PATH}`)),
                ),
                HIDAsync: { open: jest.fn() },
            } satisfies NodeHid;

            const enumeration = await new HidApi({ nodeHid }).enumerate();

            expect(enumeration).toEqual({
                success: false,
                error: { code: ERRORS.UNEXPECTED_ERROR },
            });
        });

        it('closes a device that got disconnected', async () => {
            const { api, nodeHid, handle, path } = await setup();
            await api.openDevice(path);

            nodeHid.devicesAsync.mockResolvedValueOnce([]);
            await api.enumerate();

            expect(handle.close).toHaveBeenCalledTimes(1);
            expect(await api.read(path)).toEqual({
                success: false,
                error: { code: ERRORS.DEVICE_NOT_FOUND },
            });
        });
    });

    describe('openDevice', () => {
        it('opens the device once even when it is opened again for a new session', async () => {
            const { api, nodeHid, path } = await setup();

            expect(await api.openDevice(path)).toEqual({ success: true, payload: undefined });
            expect(await api.openDevice(path, { reset: true })).toEqual({
                success: true,
                payload: undefined,
            });
            expect(nodeHid.HIDAsync.open).toHaveBeenCalledTimes(1);
            expect(nodeHid.HIDAsync.open).toHaveBeenCalledWith(SYSTEM_PATH);
        });

        it('does not probe the report ID outside Windows', async () => {
            const { api, handle, path } = await setup({ platform: 'darwin' });

            await api.openDevice(path);

            expect(handle.write).not.toHaveBeenCalled();
        });

        it('fails without the original error message when the device cannot be opened', async () => {
            const { api, nodeHid, path } = await setup();
            nodeHid.HIDAsync.open.mockRejectedValueOnce(new Error(`cannot open ${SYSTEM_PATH}`));

            expect(await api.openDevice(path)).toEqual({
                success: false,
                error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
            });
        });

        it('fails for an unknown path', async () => {
            const { api } = await setup();

            expect(await api.openDevice(PathInternal('hid-unknown'))).toEqual({
                success: false,
                error: { code: ERRORS.DEVICE_NOT_FOUND },
            });
        });
    });

    describe('report ID on Windows', () => {
        it('prepends a zero report ID when the device accepts 65 byte reports', async () => {
            const { api, handle, path } = await setup({ platform: 'win32' });

            await api.openDevice(path);
            handle.write.mockClear();
            await api.write(path, PACKET);

            const written = handle.write.mock.calls[0]?.[0];
            expect(written).toHaveLength(65);
            expect(written?.[0]).toBe(0);
            expect(written?.subarray(1, 1 + PACKET.length)).toEqual(PACKET);
        });

        it('writes plain 64 byte packets when the device rejects the prepended report', async () => {
            const handle = mockHandle();
            handle.write.mockImplementation(values =>
                values.length === 65
                    ? Promise.reject(new Error('Cannot write to hid device'))
                    : Promise.resolve(values.length),
            );
            const { api, path } = await setup({ platform: 'win32', handle });

            await api.openDevice(path);
            handle.write.mockClear();
            await api.write(path, PACKET);

            const written = handle.write.mock.calls[0]?.[0];
            expect(written).toHaveLength(64);
            expect(written?.subarray(0, PACKET.length)).toEqual(PACKET);
        });

        it('refuses to open a device that accepts neither report format', async () => {
            const handle = mockHandle();
            handle.write.mockRejectedValue(new Error('Cannot write to hid device'));
            const { api, path } = await setup({ platform: 'win32', handle });

            expect(await api.openDevice(path)).toEqual({
                success: false,
                error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
            });
            expect(handle.close).toHaveBeenCalledTimes(1);
        });
    });

    describe('write', () => {
        it('pads the packet to 64 bytes', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);

            expect(await api.write(path, PACKET)).toEqual({ success: true, payload: undefined });

            const written = handle.write.mock.calls[0]?.[0];
            expect(written).toHaveLength(64);
            expect(written?.subarray(PACKET.length).every(byte => byte === 0)).toBe(true);
        });

        it('reports a failed and an empty write as a transfer error', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);

            handle.write.mockRejectedValueOnce(new Error('Cannot write to hid device'));
            expect(await api.write(path, PACKET)).toEqual({
                success: false,
                error: { code: ERRORS.INTERFACE_DATA_TRANSFER },
            });

            handle.write.mockResolvedValueOnce(0);
            expect(await api.write(path, PACKET)).toEqual({
                success: false,
                error: { code: ERRORS.INTERFACE_DATA_TRANSFER },
            });
        });

        it('fails when the device is not opened', async () => {
            const { api, path } = await setup();

            expect(await api.write(path, PACKET)).toEqual({
                success: false,
                error: { code: ERRORS.DEVICE_NOT_FOUND },
            });
        });
    });

    describe('read', () => {
        it('skips timed out and empty reads until a report arrives', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);
            const report = Buffer.alloc(64, 0x3f);
            handle.read
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(Buffer.alloc(0))
                .mockResolvedValueOnce(report);

            expect(await api.read(path)).toEqual({ success: true, payload: report });
            expect(handle.read).toHaveBeenCalledTimes(3);
        });

        it('stops when the signal is aborted', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);
            const abortController = new AbortController();
            handle.read.mockImplementation(() => {
                abortController.abort();

                return Promise.resolve(undefined);
            });

            expect(await api.read(path, { signal: abortController.signal })).toEqual({
                success: false,
                error: { code: ERRORS.ABORTED_BY_SIGNAL },
            });
        });

        it('reports a failed read as a transfer error', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);
            handle.read.mockRejectedValueOnce(new Error('could not read from HID device'));

            expect(await api.read(path)).toEqual({
                success: false,
                error: { code: ERRORS.INTERFACE_DATA_TRANSFER },
            });
        });

        it('ends the read of the previous session before a taken over session is opened', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);
            const inFlightRead = createDeferred<Buffer | undefined>();
            handle.read.mockReturnValueOnce(inFlightRead.promise);

            const previousOwnerRead = api.read(path);
            let isReopened = false;
            const reopen = api.openDevice(path, { reset: true }).then(() => {
                isReopened = true;
            });
            await Promise.resolve();

            // The takeover waits for the transfer that is physically in flight.
            expect(isReopened).toBe(false);

            inFlightRead.resolve(undefined);
            await reopen;

            expect(await previousOwnerRead).toEqual({
                success: false,
                error: { code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION },
            });
            expect(handle.read).toHaveBeenCalledTimes(1);
        });
    });

    describe('closeDevice', () => {
        it('closes the handle only after the in-flight read has finished', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);
            const inFlightRead = createDeferred<Buffer | undefined>();
            handle.read.mockReturnValueOnce(inFlightRead.promise);

            const pendingRead = api.read(path);
            const closing = api.closeDevice(path);
            await Promise.resolve();

            expect(handle.close).not.toHaveBeenCalled();

            inFlightRead.resolve(undefined);

            expect(await closing).toEqual({ success: true, payload: undefined });
            expect(handle.close).toHaveBeenCalledTimes(1);
            expect(await pendingRead).toEqual({
                success: false,
                error: { code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION },
            });
        });

        it('reports a handle that cannot be closed', async () => {
            const { api, handle, path } = await setup();
            await api.openDevice(path);
            handle.close.mockRejectedValueOnce(new Error('close failed'));

            expect(await api.closeDevice(path)).toEqual({
                success: false,
                error: { code: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE },
            });
        });
    });
});
