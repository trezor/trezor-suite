import { parseConnectSettings } from '../../data/connectSettings';
import { DataManager } from '../../data/DataManager';
import { DeviceList } from '../DeviceList';

const { createTestTransport } = global.JestMocks;

const waitForNthEventOfType = (
    emitter: { on: (...args: any[]) => any },
    type: string,
    number: number,
) => {
    // wait for all device-connect events
    return new Promise<void>(resolve => {
        let i = 0;
        emitter.on(type, () => {
            if (++i === number) {
                resolve();
            }
        });
    });
};

describe('DeviceList', () => {
    beforeAll(async () => {
        // todo: I don't get it. If we pass empty messages: {} (see getDeviceListParams), tests behave differently.
        await DataManager.load({
            ...parseConnectSettings({}),
        });
    });

    let list: DeviceList;
    let eventsSpy: jest.Mock;

    beforeEach(() => {
        list = new DeviceList({
            ...parseConnectSettings({}),
            messages: DataManager.getProtobufMessages(),
        });
        eventsSpy = jest.fn();
        (
            [
                'transport-start',
                'transport-error',
                'device-changed',
                'device-connect',
                'device-connect_unacquired',
                'device-acquired',
                'device-released',
                'device-disconnect',
            ] as const
        ).forEach(event => {
            list.on(event, data => eventsSpy(event, data));
        });
    });

    afterEach(() => {
        list.dispose();
    });

    it('setTransports throws error on unknown transport (string)', () => {
        expect(() =>
            list.setTransports(
                // @ts-expect-error
                ['FooBarTransport'],
            ),
        ).toThrow('unexpected type: FooBarTransport');
    });

    it('setTransports throws error on unknown transport (class)', () => {
        expect(() =>
            list.setTransports(
                // @ts-expect-error
                [{}, () => {}, [], String, 1, 'meow-non-existent'],
            ),
        ).toThrow('DeviceList.init: transports[] of unexpected type');
    });

    it('setTransports accepts transports in form of transport class', () => {
        const transport = createTestTransport();
        const classConstructor = transport.constructor as unknown as typeof transport;
        expect(() => list.setTransports([classConstructor])).not.toThrow();
    });

    it('.init() throws async error from transport.init()', async () => {
        const transport = createTestTransport();
        jest.spyOn(transport, 'init').mockImplementation(() => ({
            promise: Promise.resolve({
                success: false,
                error: 'unexpected error',
                message: '',
            } as const),
            abort: () => {},
        }));

        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        // transport-error is not emitted yet because list.init is not awaited
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        await list.pendingConnection();
        expect(eventsSpy).toHaveBeenCalledTimes(1);
    });

    it('.init() throws async error from transport.enumerate()', async () => {
        const transport = createTestTransport();
        jest.spyOn(transport, 'enumerate').mockImplementation(() => ({
            promise: Promise.resolve({
                success: false,
                error: 'unexpected error',
                message: '',
            } as const),
            abort: () => {},
        }));

        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        // transport-error is not emitted yet because list.init is not awaited
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        await list.pendingConnection();
        expect(eventsSpy).toHaveBeenCalledTimes(1);
        expect(eventsSpy.mock.calls[0][0]).toEqual('transport-error');
    });

    it('.init() with pendingTransportEvent (unacquired device)', async () => {
        const transport = createTestTransport({
            openDevice: () => Promise.resolve({ success: false, error: 'wrong previous session' }),
        });

        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        await list.pendingConnection();

        const events = eventsSpy.mock.calls.map(call => call[0]);
        expect(events).toEqual(['device-connect_unacquired', 'transport-start']);
    });

    it('.init() with pendingTransportEvent (disconnected device)', async () => {
        const transport = createTestTransport({
            openDevice: () => Promise.resolve({ success: false, error: 'device not found' }),
        });

        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        const transportFirstEvent = list.pendingConnection();

        // NOTE: this behavior is wrong, if device creation fails DeviceList shouldn't wait 10 secs.
        jest.useFakeTimers();
        // move 9 sec forward
        await jest.advanceTimersByTimeAsync(9 * 1000);
        // no events yet
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        // move 2 sec forward
        await jest.advanceTimersByTimeAsync(2 * 1000);
        // promise should be resolved by now
        await transportFirstEvent;
        jest.useRealTimers();

        expect(eventsSpy).toHaveBeenCalledTimes(1);
        expect(eventsSpy.mock.calls[0][0]).toEqual('transport-start');
    });

    it('.init() with pendingTransportEvent (unreadable device)', async () => {
        const transport = createTestTransport({
            read: () => {
                return Promise.resolve({
                    success: true,
                    payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
                });
            },
        });

        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        await list.pendingConnection();

        const events = eventsSpy.mock.calls.map(call => call[0]);
        expect(events).toEqual([
            'device-changed',
            'device-acquired',
            'device-connect_unacquired',
            'transport-start',
        ]);
    });

    it('.init() with pendingTransportEvent (multiple acquired devices)', async () => {
        const transport = createTestTransport({
            enumerate: () => {
                return { success: true, payload: [{ path: '1' }, { path: '2' }, { path: '3' }] };
            },
        });

        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        await list.pendingConnection();

        const events = eventsSpy.mock.calls
            .filter(call => call[0] !== 'device-changed')
            .map(call => [call[0], call[1].path]);

        // note: acquire - release - connect should be ok.
        // acquire - deviceList._takeAndCreateDevice start (run -> rurInner -> getFeatures -> release) -> deviceList._takeAndCreateDevice end => emit DEVICE.CONNECT
        expect(events).toEqual([
            ['device-acquired', '1'],
            ['device-acquired', '2'],
            ['device-acquired', '3'],
            ['device-released', '1'],
            ['device-connect', '1'],
            ['device-released', '2'],
            ['device-connect', '2'],
            ['device-released', '3'],
            ['device-connect', '3'],
            ['transport-start', undefined],
        ]);
    });

    it('.init() with pendingTransportEvent (device acquired after retry)', async () => {
        let openTries = 0;
        const transport = createTestTransport({
            openDevice: (path: string) => {
                if (openTries < 1) {
                    openTries++;

                    return { success: false, error: 'totally unexpected' };
                }

                return { success: true, payload: [{ path }] };
            },
        });

        // NOTE: this behavior is wrong
        jest.useFakeTimers();
        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        const transportFirstEvent = list.pendingConnection();
        await jest.advanceTimersByTimeAsync(6 * 1000); // TODO: this is wrong
        await transportFirstEvent;
        jest.useRealTimers();

        expect(eventsSpy).toHaveBeenCalledTimes(8);
        const events = eventsSpy.mock.calls.map(call => call[0]);
        expect(events).toEqual([
            'device-changed',
            'device-acquired',
            'device-changed',
            'device-acquired',
            'device-changed',
            'device-released',
            'device-connect',
            'transport-start',
        ]);
    });

    it('.init() without pendingTransportEvent (device connected after start)', async () => {
        const transport = createTestTransport();

        list.setTransports([transport]);
        list.init();
        await list.pendingConnection();
        // transport start emitted almost immediately (after first enumerate)
        expect(eventsSpy).toHaveBeenCalledTimes(1);

        // wait for device-connect event
        await new Promise(resolve => list.on('device-connect', resolve));

        const events = eventsSpy.mock.calls.map(call => call[0]);
        expect(events).toEqual([
            'transport-start',
            'device-changed',
            'device-acquired',
            'device-changed',
            'device-released',
            'device-connect',
        ]);
    });

    it('multiple devices connected after .init()', async () => {
        let onChangeCallback = (..._args: any[]) => {};
        const transport = createTestTransport({
            enumerate: () => {
                return { success: true, payload: [] };
            },
            on: (eventName: string, callback: typeof onChangeCallback) => {
                if (eventName === 'transport-interface-change') {
                    onChangeCallback = callback;
                }
            },
        });

        list.setTransports([transport]);
        list.init({ pendingTransportEvent: true });
        await list.pendingConnection();

        onChangeCallback([{ path: '1' }, { path: '2' }, { path: '3' }]);

        // wait for all device-connect events
        await waitForNthEventOfType(list, 'device-connect', 3);

        const events = eventsSpy.mock.calls
            .filter(call => call[0] !== 'device-changed')
            .map(call => [call[0], call[1].path]);

        expect(events).toEqual([
            ['transport-start', undefined],
            ['device-acquired', '1'],
            ['device-acquired', '2'],
            ['device-acquired', '3'],
            ['device-released', '1'],
            ['device-connect', '1'],
            ['device-released', '2'],
            ['device-connect', '2'],
            ['device-released', '3'],
            ['device-connect', '3'],
        ]);
    });
});
