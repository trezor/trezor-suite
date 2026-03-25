import { DataManager } from '../../data/DataManager';
import { parseConnectSettings } from '../../data/connectSettings';
import { initializeFirmwareConfig } from '../../data/firmwareInfo';
import { DeviceList } from '../DeviceList';

const { createTestTransport, createTestTransportClass } = global.JestMocks;

const waitForNthEventOfType = (
    emitter: { on: (...args: any[]) => any },
    type: string,
    number: number,
) =>
    // wait for all device-connect events
    new Promise<void>(resolve => {
        let i = 0;
        emitter.on(type, () => {
            if (++i === number) {
                resolve();
            }
        });
    });

describe('DeviceList', () => {
    beforeAll(async () => {
        // todo: I don't get it. If we pass empty messages: {} (see getDeviceListParams), tests behave differently.
        await DataManager.load(
            {
                ...parseConnectSettings({}),
            },
            true,
            true,
            initializeFirmwareConfig,
        );
    });

    let list: DeviceList;
    let eventsSpy: jest.Mock;

    beforeEach(() => {
        list = new DeviceList({
            ...parseConnectSettings({}),
            priority: 0,
            messages: DataManager.getProtobufMessages(),
        });
        eventsSpy = jest.fn();
        list.on('transport-start', ({ apiType }) => eventsSpy('transport-start', apiType));
        list.on('transport-error', ({ apiType }) => eventsSpy('transport-error', apiType));
        (
            [
                'device-connect',
                'device-connect_unacquired',
                'device-changed',
                'device-disconnect',
            ] as const
        ).forEach(event => {
            list.on(event, device =>
                eventsSpy(event, device.transport.apiType, device.transportPath),
            );
        });
    });

    afterEach(() => {
        list.dispose();
    });

    it('.init() throws error on unknown transport (string)', async () => {
        await expect(() =>
            list.init({
                // @ts-expect-error
                transports: ['FooBarTransport'],
            }),
        ).rejects.toThrow('unexpected type: FooBarTransport');
    });

    it('.init() throws error on unknown transport (class)', async () => {
        await expect(() =>
            list.init({
                // @ts-expect-error
                transports: [{}, () => {}, [], String, 1, 'meow-non-existent'],
            }),
        ).rejects.toThrow('DeviceList.init: transports[] of unexpected type');
    });

    it('.init() accepts transports in form of transport class', async () => {
        const classConstructor = createTestTransportClass();
        await expect(list.init({ transports: [classConstructor] })).resolves.not.toThrow();
    });

    it('.init() throws async error from transport.init()', async () => {
        const transport = createTestTransport();
        jest.spyOn(transport, 'init').mockImplementation(() =>
            Promise.resolve({
                success: false,
                error: 'unexpected error',
                message: '',
            } as const),
        );

        list.init({ transports: [transport], pendingTransportEvent: true });
        // transport-error is not emitted yet because list.init is not awaited
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        await list.pendingConnection();
        expect(eventsSpy).toHaveBeenCalledTimes(1);
    });

    it('.init() throws async error from transport.enumerate()', async () => {
        const transport = createTestTransport();
        jest.spyOn(transport, 'enumerate').mockImplementation(() =>
            Promise.resolve({
                success: false,
                error: 'unexpected error',
                message: '',
            } as const),
        );

        list.init({ transports: [transport], pendingTransportEvent: true });
        // transport-error is not emitted yet because list.init is not awaited
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        await list.pendingConnection();
        expect(eventsSpy).toHaveBeenCalledTimes(1);
        expect(eventsSpy.mock.calls[0][0]).toEqual('transport-error');
    });

    it('.init() with pendingTransportEvent (unacquired device)', async () => {
        const transport = createTestTransport({
            openDevice: () =>
                Promise.resolve({ success: false, error: { code: 'wrong previous session' } }),
        });

        list.init({ transports: [transport], pendingTransportEvent: true });
        await list.pendingConnection();

        const events = eventsSpy.mock.calls.map(call => call[0]);
        expect(events).toEqual(['device-connect_unacquired', 'transport-start']);
    });

    it('.init() with pendingTransportEvent (disconnected device)', async () => {
        const transport = createTestTransport({
            openDevice: () =>
                Promise.resolve({ success: false, error: { code: 'device not found' } }),
        });

        list.init({ transports: [transport], pendingTransportEvent: true });
        await list.pendingConnection();

        expect(eventsSpy).toHaveBeenCalledTimes(1);
        expect(eventsSpy.mock.calls[0][0]).toEqual('transport-start');
    });

    it('.init() with pendingTransportEvent (unreadable device)', async () => {
        const transport = createTestTransport({
            read: () =>
                Promise.resolve({
                    success: true,
                    payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
                }),
        });

        list.init({ transports: [transport], pendingTransportEvent: true });
        await list.pendingConnection();

        const events = eventsSpy.mock.calls.map(call => call[0]);
        expect(events).toEqual(['device-connect_unacquired', 'transport-start']);
    });

    it('.init() with pendingTransportEvent (multiple acquired devices)', async () => {
        const transport = createTestTransport({
            enumerate: () => ({
                success: true,
                payload: [{ path: '1' }, { path: '2' }, { path: '3' }],
            }),
        });

        list.init({ transports: [transport], pendingTransportEvent: true });
        await list.pendingConnection();

        // note: acquire - release - connect should be ok.
        // acquire - deviceList._takeAndCreateDevice start (run -> rurInner -> getFeatures -> release) -> deviceList._takeAndCreateDevice end => emit DEVICE.CONNECT
        expect(eventsSpy.mock.calls).toEqual([
            ['device-connect', 'usb', '1'],
            ['device-connect', 'usb', '2'],
            ['device-connect', 'usb', '3'],
            ['transport-start', 'usb', undefined],
        ]);
    });

    it('.init() with pendingTransportEvent (multiple transports)', async () => {
        const transportA = createTestTransport({
            enumerate: () => ({ success: true, payload: [{ path: '1' }, { path: '2' }] }),
            openDevice: (path: string) =>
                (path === '2'
                    ? new Promise(resolve => setTimeout(resolve, 500))
                    : Promise.resolve()
                ).then(() => ({ success: true, payload: [{ path }] })),
        });
        const transportB = createTestTransport({
            enumerate: () => ({
                success: true,
                payload: [{ path: '1' }, { path: '2' }, { path: '3' }],
            }),
            openDevice: (path: string) =>
                path === '2'
                    ? Promise.resolve({ success: false, error: { code: 'device not found' } })
                    : Promise.resolve({ success: true, payload: [{ path }] }),
            type: 'usb2',
        });

        list.init({ transports: [transportA, transportB], pendingTransportEvent: true });

        await list.pendingConnection();

        expect(eventsSpy.mock.calls).toEqual([
            ['device-connect', 'usb', '1'],
            ['device-connect', 'usb', '2'],
            ['transport-start', 'usb', undefined],
            ['device-connect', 'usb2', '1'],
            ['device-connect', 'usb2', '3'],
            ['transport-start', 'usb2', undefined],
        ]);
    });

    it('.init() without pendingTransportEvent (device connected after start)', async () => {
        const transport = createTestTransport();

        list.init({ transports: [transport] });
        await list.pendingConnection();
        // transport start emitted almost immediately (after first enumerate)
        expect(eventsSpy).toHaveBeenCalledTimes(1);

        // wait for device-connect event
        await new Promise(resolve => list.on('device-connect', resolve));

        const events = eventsSpy.mock.calls.map(call => call[0]);
        expect(events).toEqual(['transport-start', 'device-connect']);
    });

    it('multiple devices connected after .init()', async () => {
        let onChangeCallback = (..._args: any[]) => {};
        const transport = createTestTransport({
            enumerate: () => ({ success: true, payload: [] }),
            on: (eventName: string, callback: typeof onChangeCallback) => {
                if (eventName === 'transport-interface-change') {
                    onChangeCallback = callback;
                }
            },
        });

        list.init({ transports: [transport], pendingTransportEvent: true });
        await list.pendingConnection();

        // emit TRANSPORT.CHANGE 3 times
        onChangeCallback([{ path: '1' }, { path: '2' }]);
        onChangeCallback([{ path: '1' }, { path: '3' }]); // path 2 disconnected, path 3 connected
        onChangeCallback([{ path: '1' }, { path: '3' }, { path: '4' }]); // path 4 connected

        // wait for all device-connect events
        await waitForNthEventOfType(list, 'device-connect', 3);

        expect(eventsSpy.mock.calls).toEqual([
            ['transport-start', 'usb', undefined],
            ['device-connect', 'usb', '1'],
            ['device-connect', 'usb', '3'],
            ['device-connect', 'usb', '4'],
        ]);
    });

    it('FIRMWARE_VERSION_CHANGED event', async () => {
        let readCount = 0;
        const transport = createTestTransport({
            read: () => {
                let res = '';
                if (readCount === 0) {
                    // cancel response
                    res = '3f2323000300000000000000000000000000000000';
                } else if (readCount === 1) {
                    // features
                    res =
                        // headers
                        `3f2323001100000017` +
                        // { major_version: 2, minor_version: 0, patch_version: 0, model: 'T', initialized: false, device_id: 'device-id' }
                        `10021800200${0}32096465766963652d69646000aa010154`;
                } else {
                    // features
                    res =
                        // headers
                        `3f2323001100000017` +
                        // { major_version: 2, minor_version: 0, patch_version: 1, model: 'T', initialized: false, device_id: 'device-id' }
                        `10021800200${1}32096465766963652d69646000aa010154`;
                }
                readCount++;

                return Promise.resolve({
                    success: true,
                    payload: Buffer.from(res, 'hex'),
                });
            },
        });

        list.init({ transports: [transport], pendingTransportEvent: true });
        await list.pendingConnection();

        const device = list.getOnlyDevice();
        if (!device) throw new Error('Device is missing');

        const spyEvent = jest.fn();
        device.on('device-firmware_version_changed', spyEvent);

        // Initialize > GetFeatures
        await device.acquire();
        await device.initialize(false);
        await device.release();

        expect(spyEvent.mock.calls[0][0]).toMatchObject({
            oldVersion: [2, 0, 0],
            newVersion: [2, 0, 1],
        });
    });
});
