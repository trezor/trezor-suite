import type { Device as NodeHidDevice } from 'node-hid';

import { DEVICE_TYPE, TRANSPORT_ERROR as ERRORS, PathInternal } from '@trezor/transport-common';
import { createDeferred, resolveAfter } from '@trezor/utils';

import { HidApi, type NodeHid } from './hid';

const SYSTEM_PATH = 'DevSrvsID:4294971234';
const SERIAL_NUMBER = '0123456789ABCDEF01234567';
const PACKET = Buffer.from('3f232300010000000000', 'hex');

const mockNodeHidDevice = (device: Partial<NodeHidDevice> = {}): NodeHidDevice => ({
    vendorId: 0x534c,
    productId: 0x0001,
    path: SYSTEM_PATH,
    serialNumber: SERIAL_NUMBER,
    release: 0x0100,
    interface: 0,
    usagePage: 0xff00,
    ...device,
});

// A real read waits for its timeout, an immediately resolved one would starve the event loop.
const mockHandle = () => ({
    read: jest.fn((_timeout?: number) => resolveAfter(1).then((): Buffer | undefined => undefined)),
    write: jest.fn((values: Buffer) => Promise.resolve(values.length)),
    close: jest.fn(() => Promise.resolve()),
});

const mockLogger = () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() });

// Polling runs from the first enumeration until dispose.
const apis: HidApi[] = [];
const createApi = (params: ConstructorParameters<typeof HidApi>[0]) => {
    const api = new HidApi(params);
    apis.push(api);

    return api;
};

type SetupParams = {
    devices?: NodeHidDevice[];
    handle?: ReturnType<typeof mockHandle>;
};

const setup = async ({
    devices = [mockNodeHidDevice()],
    handle = mockHandle(),
}: SetupParams = {}) => {
    const nodeHid = {
        devicesAsync: jest.fn(() => Promise.resolve(devices)),
        HIDAsync: { open: jest.fn(() => Promise.resolve(handle)) },
        getHidapiVersion: jest.fn(() => '0.15.0'),
    } satisfies NodeHid;
    const logger = mockLogger();
    // @ts-expect-error: a minimal logger is enough here
    const api = createApi({ loadNodeHid: () => nodeHid, logger });
    const enumeration = await api.enumerate();
    const path = enumeration.success ? enumeration.payload[0]?.path : undefined;

    return { api, nodeHid, handle, logger, enumeration, path: path ?? PathInternal('missing') };
};

describe(HidApi.name, () => {
    afterEach(() => {
        apis.splice(0).forEach(api => api.dispose());
        jest.useRealTimers();
    });

    it('lists only the wire interface, without the system path or the serial number', async () => {
        const { enumeration } = await setup({
            devices: [
                mockNodeHidDevice(),
                mockNodeHidDevice({ path: 'u2f', interface: 1, usagePage: 0xf1d0 }),
                mockNodeHidDevice({ path: 'debug', interface: 2, usagePage: 0xff01 }),
            ],
        });

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
        expect(JSON.stringify(enumeration)).not.toContain(SERIAL_NUMBER);
        expect(JSON.stringify(enumeration)).not.toContain(SYSTEM_PATH);
    });

    it('loads node-hid with the first enumeration and polls for changes from then on', async () => {
        jest.useFakeTimers();
        const nodeHid = {
            devicesAsync: jest.fn(() => Promise.resolve([mockNodeHidDevice()])),
            HIDAsync: { open: jest.fn() },
            getHidapiVersion: jest.fn(() => '0.15.0'),
        } satisfies NodeHid;
        const loadNodeHid = jest.fn(() => nodeHid);
        const api = createApi({ loadNodeHid });
        const onChange = jest.fn();
        api.on('transport-interface-change', onChange);

        api.listen();
        await jest.advanceTimersByTimeAsync(2000);

        expect(loadNodeHid).not.toHaveBeenCalled();

        await api.enumerate();
        nodeHid.devicesAsync.mockResolvedValue([]);
        await jest.advanceTimersByTimeAsync(500);

        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('reports an addon that fails to load and loads it again with the next enumeration', async () => {
        const nodeHid = {
            devicesAsync: jest.fn(() => Promise.resolve([])),
            HIDAsync: { open: jest.fn() },
            getHidapiVersion: jest
                .fn<string, []>()
                .mockImplementationOnce(() => {
                    throw new Error('Failed to find binding for HID');
                })
                .mockReturnValue('0.15.0'),
        } satisfies NodeHid;
        const api = createApi({ loadNodeHid: () => nodeHid });

        expect(await api.enumerate()).toEqual({
            success: false,
            error: { code: ERRORS.UNEXPECTED_ERROR },
        });
        expect(await api.enumerate()).toEqual({ success: true, payload: [] });
    });

    it.each([
        { name: 'prepends a zero report ID', acceptedLengths: [65], packetLength: 65 },
        { name: 'writes plain packets', acceptedLengths: [64], packetLength: 64 },
    ])(
        '$name when the device takes only such reports',
        async ({ acceptedLengths, packetLength }) => {
            const handle = mockHandle();
            handle.write.mockImplementation(values =>
                acceptedLengths.includes(values.length)
                    ? Promise.resolve(values.length)
                    : Promise.reject(new Error('write failed')),
            );
            const { api, path } = await setup({ handle });

            await api.openDevice(path);
            handle.write.mockClear();
            await api.write(path, PACKET);

            expect(handle.write.mock.calls[0]?.[0]).toEqual(
                Buffer.concat([
                    Buffer.alloc(packetLength - 64),
                    PACKET,
                    Buffer.alloc(64 - PACKET.length),
                ]),
            );
        },
    );

    it('refuses a device that takes neither report format', async () => {
        const handle = mockHandle();
        handle.write.mockRejectedValue(new Error('write failed'));
        const { api, path } = await setup({ handle });

        expect(await api.openDevice(path)).toEqual({
            success: false,
            error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
        });
        expect(handle.close).toHaveBeenCalledTimes(1);
    });

    it('blanks the system path out of a logged open failure', async () => {
        const { api, nodeHid, logger, path } = await setup();
        nodeHid.HIDAsync.open.mockRejectedValueOnce(
            new Error(`cannot open device with path ${SYSTEM_PATH}`),
        );

        expect(await api.openDevice(path)).toEqual({
            success: false,
            error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
        });
        const logged = logger.error.mock.calls.map(([message]) => String(message)).join('\n');
        expect(logged).toContain('cannot open device with path <redacted>');
    });

    it('closes a handle that finished opening after the device disconnected', async () => {
        const handle = mockHandle();
        const { api, nodeHid, path } = await setup({ handle });
        const opening = createDeferred<typeof handle>();
        nodeHid.HIDAsync.open.mockReturnValueOnce(opening.promise);

        const opened = api.openDevice(path);
        nodeHid.devicesAsync.mockResolvedValueOnce([]);
        await api.enumerate();
        opening.resolve(handle);

        expect(await opened).toEqual({ success: false, error: { code: ERRORS.DEVICE_NOT_FOUND } });
        expect(handle.close).toHaveBeenCalledTimes(1);
    });

    it('hands a taken over session to the new owner only after the previous one is cleared out', async () => {
        const { api, handle, path } = await setup();
        await api.openDevice(path);
        const firstReport = createDeferred<Buffer | undefined>();
        const queuedReport = createDeferred<Buffer | undefined>();
        handle.read
            .mockReturnValueOnce(firstReport.promise)
            .mockReturnValueOnce(queuedReport.promise);
        const previousRead = api.read(path);

        const takeover = api.openDevice(path, { reset: true });
        await resolveAfter(0);

        // The takeover waits for the read in flight before it touches the device.
        expect(handle.read).toHaveBeenCalledTimes(1);

        firstReport.resolve(Buffer.alloc(64, 0x3f));
        await previousRead;
        await resolveAfter(0);

        // While the takeover drains the queued reports, the previous owner can neither send the
        // rest of its message nor take a part of the response.
        expect(await api.write(path, PACKET)).toEqual({
            success: false,
            error: { code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION },
        });
        expect(await api.read(path)).toEqual({
            success: false,
            error: { code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION },
        });

        handle.write.mockClear();
        queuedReport.resolve(Buffer.alloc(64, 0x3f));

        expect(await takeover).toEqual({ success: true, payload: undefined });
        // The firmware may still hold the start of the message the previous owner was cut off in.
        expect(handle.write).toHaveBeenCalledWith(Buffer.alloc(65, 0));
        expect(await api.write(path, PACKET)).toEqual({ success: true, payload: undefined });
    });

    it('closes the handle only after the read in flight has finished', async () => {
        const { api, handle, path } = await setup();
        await api.openDevice(path);
        const inFlightReport = createDeferred<Buffer | undefined>();
        handle.read.mockReturnValueOnce(inFlightReport.promise);
        const read = api.read(path);

        const closed = api.closeDevice(path);
        await resolveAfter(0);

        expect(handle.close).not.toHaveBeenCalled();

        inFlightReport.resolve(undefined);
        await closed;

        expect(handle.close).toHaveBeenCalledTimes(1);
        expect(await read).toEqual({
            success: false,
            error: { code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION },
        });
    });
});
