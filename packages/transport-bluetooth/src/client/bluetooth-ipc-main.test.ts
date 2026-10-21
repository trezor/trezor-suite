import { createDeferred } from '@trezor/utils';

import { BluetoothIpc } from './bluetooth-ipc-main';
import { TrezorBluetooth } from './trezor-bluetooth';
import { type BluetoothDevice, type BluetoothIpcState } from './types';

// init waits a second for devices to be discovered
jest.mock('@trezor/utils', () => ({
    ...jest.requireActual('@trezor/utils'),
    resolveAfter: () => Promise.resolve(),
}));

afterAll(() => {
    jest.restoreAllMocks();
});

const mockBluetoothDevice = (device: Partial<BluetoothDevice> = {}): BluetoothDevice => ({
    id: 'mock-bluetooth-device',
    name: 'Trezor',
    macAddress: '00:11:22:33:44:55',
    data: [0, 0, 0],
    connected: false,
    connectionStatus: { type: 'disconnected' },
    lastUpdatedTimestamp: 0,
    paired: true,
    ...device,
});

describe('BluetoothIpc scan ownership', () => {
    const sendMock = jest.spyOn(TrezorBluetooth.prototype, 'sendMessage');
    const isConnectedMock = jest.spyOn(TrezorBluetooth.prototype, 'isConnected');
    let ipc: BluetoothIpc;

    beforeEach(async () => {
        sendMock.mockReset();
        sendMock.mockResolvedValue({ devices: [], success: true });
        isConnectedMock.mockReturnValue(true);
        ipc = new BluetoothIpc({ url: 'ws://localhost:12345' });
        // the api is created lazily, connect it up front so tests only observe their own messages
        await ipc['connectApi']();
        sendMock.mockClear();
    });

    it('does not restore an owner stopped while start_scan is pending', async () => {
        await ipc.startScan('background');
        const scan = createDeferred<{ devices: BluetoothDevice[] }>();
        const scanStarted = createDeferred<void>();
        sendMock.mockImplementationOnce(() => {
            scanStarted.resolve();

            return scan.promise;
        });

        const start = ipc.startScan('ui');
        await scanStarted.promise;
        await ipc.stopScan('ui');
        scan.resolve({ devices: [] });
        await start;
        sendMock.mockClear();

        await expect(ipc.stopScan('background')).resolves.toEqual({ success: true });
        expect(sendMock).toHaveBeenCalledWith({ method: 'stop_scan', params: undefined });
    });

    it('keeps scanning for an owner whose start has not yet completed', async () => {
        await ipc.startScan('background');
        const start = ipc.startScan('ui');
        const stop = ipc.stopScan('background');
        await Promise.all([start, stop]);

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual([
            'start_scan',
            'start_scan',
        ]);

        await ipc.stopScan('ui');
        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual([
            'start_scan',
            'start_scan',
            'stop_scan',
        ]);
    });

    it('keeps failed scan intent until its owner stops', async () => {
        sendMock.mockRejectedValueOnce(new Error('Adapter disabled'));
        await expect(ipc.startScan('ui')).resolves.toEqual({
            success: false,
            error: { message: 'Adapter disabled', code: 'Bluetooth_Error' },
        });
        sendMock.mockClear();

        await ipc.stopScan('background');
        expect(sendMock).not.toHaveBeenCalled();

        await expect(ipc.stopScan('ui')).resolves.toEqual({ success: true });
        expect(sendMock).toHaveBeenCalledWith({ method: 'stop_scan', params: undefined });
    });

    it('does not send stop_scan if a new startScan starts while a connection is in flight', async () => {
        await ipc.startScan('ui');
        sendMock.mockClear();

        const connectStarted = createDeferred<void>();
        const connectDeferred = createDeferred<void>();
        isConnectedMock.mockReturnValue(false);
        const connectSpy = jest
            .spyOn(TrezorBluetooth.prototype, 'connect')
            .mockImplementationOnce(async () => {
                connectStarted.resolve();
                await connectDeferred.promise;
                isConnectedMock.mockReturnValue(true);
            });

        const info = ipc.getInfo();
        await connectStarted.promise;
        const stop = ipc.stopScan('ui');
        const start = ipc.startScan('background');

        connectDeferred.resolve();
        await Promise.all([info, stop, start]);

        expect(sendMock.mock.calls.map(([request]) => request.method)).not.toContain('stop_scan');
        connectSpy.mockRestore();
    });

    it('serializes startScan after in-flight stop_scan so scanning is not lost', async () => {
        await ipc.startScan('ui');
        sendMock.mockClear();

        const stopDeferred = createDeferred<{ success: true }>();
        const stopStarted = createDeferred<void>();
        sendMock.mockImplementationOnce(() => {
            stopStarted.resolve();

            return stopDeferred.promise;
        });

        const stop = ipc.stopScan('ui');
        await stopStarted.promise;

        const start = ipc.startScan('background');
        stopDeferred.resolve({ success: true });

        await Promise.all([stop, start]);

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual([
            'stop_scan',
            'start_scan',
        ]);
    });

    it('guard initialScan stop_scan', async () => {
        const knownDevice = mockBluetoothDevice();
        const scanStopStarted = createDeferred<void>();

        sendMock.mockImplementation(message => {
            if (message.method === 'stop_scan') {
                scanStopStarted.resolve();
            }

            return Promise.resolve({ devices: [knownDevice], success: true });
        });

        const initPromise = ipc.init({ knownDevices: [knownDevice] });
        // start scanning when initial stop_scan has started
        await scanStopStarted.promise;
        await ipc.startScan('ui');
        await initPromise;

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual([
            'set_state',
            'start_scan',
            'stop_scan',
            'start_scan',
        ]);
    });

    it('reports the connection error when startScan cannot reach the server', async () => {
        isConnectedMock.mockReturnValue(false);
        const connectSpy = jest
            .spyOn(TrezorBluetooth.prototype, 'connect')
            .mockRejectedValueOnce(new Error('ECONNREFUSED'));

        await expect(ipc.startScan('ui')).resolves.toEqual({
            success: false,
            error: { message: 'ECONNREFUSED', code: 'Bluetooth_Error' },
        });
        expect(sendMock).not.toHaveBeenCalled();
        connectSpy.mockRestore();
    });

    it('restarts scanning when the adapter becomes enabled while a scan is wanted', async () => {
        await ipc.startScan('ui');
        ipc['api']?.emit('adapter_state_changed', { state: 'enabled' });

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual(['start_scan']);
    });

    it('does not restart scanning when the adapter becomes enabled after the last owner stopped', async () => {
        await ipc.stopScan('ui');
        sendMock.mockClear();

        ipc['api']?.emit('adapter_state_changed', { state: 'enabled' });

        expect(sendMock).not.toHaveBeenCalled();
    });

    it('does not restart scanning when the last owner stops before the restart runs', async () => {
        ipc['api']?.emit('adapter_state_changed', { state: 'enabled' });
        await ipc.stopScan('ui');

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual(['stop_scan']);
    });
});

describe('BluetoothIpc connection', () => {
    const sendMock = jest.spyOn(TrezorBluetooth.prototype, 'sendMessage');
    const isConnectedMock = jest.spyOn(TrezorBluetooth.prototype, 'isConnected');
    // the first suite restores these spies, so they are created for every test
    let connectMock: jest.SpyInstance;
    let disconnectMock: jest.SpyInstance;
    let disposeMock: jest.SpyInstance;
    let ipc: BluetoothIpc;

    const methods = () => sendMock.mock.calls.map(([request]) => request.method);
    const loseConnection = () => isConnectedMock.mockReturnValue(false);
    const flush = () => new Promise(resolve => setImmediate(resolve));
    const knownDevices = [{ id: 'id', macAddress: 'aa:bb' }] as BluetoothIpcState['knownDevices'];

    beforeEach(() => {
        sendMock.mockReset();
        sendMock.mockResolvedValue({ devices: [], success: true });
        isConnectedMock.mockReset();
        loseConnection();
        connectMock = jest.spyOn(TrezorBluetooth.prototype, 'connect');
        connectMock.mockReset();
        connectMock.mockImplementation(() => {
            isConnectedMock.mockReturnValue(true);

            return Promise.resolve();
        });
        disconnectMock = jest.spyOn(TrezorBluetooth.prototype, 'disconnect');
        disconnectMock.mockReset();
        disconnectMock.mockImplementation(() => {
            loseConnection();

            return Promise.resolve();
        });
        disposeMock = jest.spyOn(TrezorBluetooth.prototype, 'dispose');
        disposeMock.mockClear();
        ipc = new BluetoothIpc({ url: 'ws://localhost:1111', headers: { a: 'b' } });
    });

    afterEach(() => {
        connectMock.mockRestore();
        disconnectMock.mockRestore();
        disposeMock.mockRestore();
    });

    describe('client creation', () => {
        it('does not create the client on construction', () => {
            expect(connectMock).not.toHaveBeenCalled();
            expect(ipc['api']).toBeUndefined();
        });

        it('is created by init with known devices', async () => {
            await ipc.init({ knownDevices });

            expect(connectMock).toHaveBeenCalledTimes(1);
            expect(ipc['api']).toBeDefined();
        });

        it('provides url and headers of the client', async () => {
            await ipc.getInfo();

            expect(ipc['api']?.settings).toMatchObject({
                url: 'ws://localhost:1111',
                headers: { a: 'b' },
            });
        });

        it('is created only once while the connection is alive', async () => {
            await ipc.startScan('ui');
            await ipc.getInfo();
            await ipc.enumerateDevices();
            await ipc.stopScan('ui');

            expect(connectMock).toHaveBeenCalledTimes(1);
        });

        it('is created again after the connection is lost', async () => {
            await ipc.getInfo();
            const first = ipc['api'];

            loseConnection();
            await ipc.getInfo();

            expect(connectMock).toHaveBeenCalledTimes(2);
            expect(ipc['api']).not.toBe(first);
            expect(ipc['api']?.settings).toMatchObject({ url: 'ws://localhost:1111' });
        });

        it('is retried after a failure', async () => {
            connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            await expect(ipc.startScan('ui')).resolves.toEqual({
                success: false,
                error: { message: 'ECONNREFUSED', code: 'Bluetooth_Error' },
            });
            await expect(ipc.getInfo()).resolves.toMatchObject({ success: true });

            expect(methods()).toEqual(['set_state', 'get_info']);
        });
    });

    describe('concurrent callers', () => {
        it('share one connection', async () => {
            const connectDeferred = createDeferred<void>();
            connectMock.mockImplementationOnce(async () => {
                await connectDeferred.promise;
                isConnectedMock.mockReturnValue(true);
            });

            const calls = Promise.all([
                ipc.getInfo(),
                ipc.enumerateDevices(),
                ipc.startScan('ui'),
                ipc.disconnectDevice('id'),
            ]);
            connectDeferred.resolve();
            await calls;

            expect(connectMock).toHaveBeenCalledTimes(1);
            expect(methods().filter(method => method === 'set_state')).toHaveLength(1);
        });

        it('do not use the connection before set_state completed', async () => {
            const setState = createDeferred<{ success: true }>();
            const setStateStarted = createDeferred<void>();
            sendMock.mockImplementationOnce(() => {
                setStateStarted.resolve();

                return setState.promise;
            });

            const first = ipc.getInfo();
            await setStateStarted.promise;
            const second = ipc.enumerateDevices();
            await flush();

            expect(ipc['api']).toBeUndefined();
            expect(methods()).toEqual(['set_state']);

            setState.resolve({ success: true });
            await Promise.all([first, second]);

            expect(methods()[0]).toBe('set_state');
            expect(methods()).toHaveLength(3);
        });

        it('get the failure of the shared connection', async () => {
            connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            const results = await Promise.all([ipc.getInfo(), ipc.disconnectDevice('id')]);

            expect(results).toEqual([
                { success: false, error: { message: 'ECONNREFUSED', code: 'Bluetooth_Error' } },
                { success: false, error: { message: 'ECONNREFUSED', code: 'Bluetooth_Error' } },
            ]);
            expect(connectMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('listeners', () => {
        it('are attached once for concurrent callers', async () => {
            const onListUpdate = jest.fn();
            ipc.on('device-list-update', onListUpdate);

            await Promise.all([ipc.getInfo(), ipc.enumerateDevices()]);
            ipc['api']?.emit('device_discovered', { id: 'id', devices: [] });

            expect(onListUpdate).toHaveBeenCalledTimes(1);
        });

        it('of a replaced client are removed by a reconnect', async () => {
            const onListUpdate = jest.fn();
            ipc.on('device-list-update', onListUpdate);

            await ipc.getInfo();
            const first = ipc['api'];
            loseConnection();
            await ipc.getInfo();
            const second = ipc['api'];
            onListUpdate.mockClear();

            first?.emit('device_discovered', { id: 'id', devices: [] });
            expect(onListUpdate).not.toHaveBeenCalled();

            second?.emit('device_discovered', { id: 'id', devices: [] });
            expect(second).not.toBe(first);
            expect(onListUpdate).toHaveBeenCalledTimes(1);
        });

        it('forward events emitted while the client is being initialized', async () => {
            const setState = createDeferred<{ success: true }>();
            const setStateStarted = createDeferred<void>();
            sendMock.mockImplementationOnce(() => {
                setStateStarted.resolve();

                return setState.promise;
            });
            const onListUpdate = jest.fn();
            ipc.on('device-list-update', onListUpdate);

            const connecting = ipc.getInfo();
            await setStateStarted.promise;
            const initializingApi = connectMock.mock.contexts[0] as TrezorBluetooth;
            initializingApi.emit('device_discovered', { id: 'id', devices: [] });
            setState.resolve({ success: true });
            await connecting;

            expect(onListUpdate).toHaveBeenCalledTimes(1);
        });
    });

    describe('failed initialization', () => {
        it('does not keep a connection whose set_state failed', async () => {
            sendMock.mockRejectedValueOnce(new Error('set_state failed'));

            await expect(ipc.getInfo()).resolves.toEqual({
                success: false,
                error: { message: 'set_state failed', code: 'Bluetooth_Error' },
            });
            expect(ipc['api']).toBeUndefined();
            expect(disposeMock).toHaveBeenCalledTimes(1);

            await expect(ipc.getInfo()).resolves.toMatchObject({ success: true });

            expect(connectMock).toHaveBeenCalledTimes(2);
            expect(methods()).toEqual(['set_state', 'set_state', 'get_info']);
        });

        it('disposes a client which failed to connect', async () => {
            connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            await ipc.getInfo();

            expect(disposeMock).toHaveBeenCalledTimes(1);
            expect(ipc['api']).toBeUndefined();
        });

        it('reports a non-Error rejection', async () => {
            connectMock.mockRejectedValueOnce('boom');

            await expect(ipc.getInfo()).resolves.toEqual({
                success: false,
                error: { message: 'boom', code: 'Bluetooth_Error' },
            });
        });

        it('reports the message of a plain object rejection', async () => {
            connectMock.mockRejectedValueOnce({ message: 'plain' });

            await expect(ipc.getInfo()).resolves.toEqual({
                success: false,
                error: { message: 'plain', code: 'Bluetooth_Error' },
            });
        });

        it.each([
            ['getInfo', () => ipc.getInfo()],
            ['startScan', () => ipc.startScan('ui')],
            ['connectDevice', () => ipc.connectDevice('id')],
            ['disconnectDevice', () => ipc.disconnectDevice('id')],
            ['forgetDevice', () => ipc.forgetDevice('id')],
        ])('%s returns the connection failure', async (_name, call) => {
            connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            await expect(call()).resolves.toEqual({
                success: false,
                error: { message: 'ECONNREFUSED', code: 'Bluetooth_Error' },
            });
            expect(sendMock).not.toHaveBeenCalled();
        });

        it('enumerateDevices returns an empty list when it cannot connect', async () => {
            connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            await expect(ipc.enumerateDevices()).resolves.toEqual([]);
            expect(sendMock).not.toHaveBeenCalled();
        });
    });

    describe('reconnect', () => {
        it('sends the known devices again', async () => {
            await ipc.init({ knownDevices });
            sendMock.mockClear();

            loseConnection();
            await ipc.getInfo();

            expect(sendMock).toHaveBeenCalledWith({
                method: 'set_state',
                params: { devices: knownDevices },
            });
        });

        it('does not resume a scan', async () => {
            await ipc.startScan('ui');
            sendMock.mockClear();

            loseConnection();
            await ipc.getInfo();

            expect(methods()).toEqual(['set_state', 'get_info']);
        });

        it('sends start_scan once when startScan itself connects', async () => {
            await ipc.startScan('ui');

            expect(methods()).toEqual(['set_state', 'start_scan']);
        });
    });

    describe('stopScan', () => {
        it('does not connect', async () => {
            await expect(ipc.stopScan('ui')).resolves.toEqual({ success: true });

            expect(connectMock).not.toHaveBeenCalled();
            expect(sendMock).not.toHaveBeenCalled();
        });

        it('does not reconnect when the connection is lost', async () => {
            await ipc.startScan('ui');
            sendMock.mockClear();
            loseConnection();

            await expect(ipc.stopScan('ui')).resolves.toEqual({ success: true });

            expect(connectMock).toHaveBeenCalledTimes(1);
            expect(sendMock).not.toHaveBeenCalled();
        });
    });

    describe('init', () => {
        it('does not connect without known devices', async () => {
            await expect(ipc.init({ knownDevices: [] })).resolves.toEqual({ success: true });

            expect(connectMock).not.toHaveBeenCalled();
            expect(sendMock).not.toHaveBeenCalled();
        });

        it('connects and sends known devices once', async () => {
            await expect(ipc.init({ knownDevices })).resolves.toEqual({ success: true });

            expect(sendMock.mock.calls.map(([request]) => request)).toEqual([
                { method: 'set_state', params: { devices: knownDevices } },
                { method: 'start_scan', params: undefined },
                { method: 'stop_scan', params: undefined },
            ]);
        });

        it('runs concurrent calls one after another', async () => {
            await Promise.all([ipc.init({ knownDevices }), ipc.init({ knownDevices })]);

            expect(methods()).toEqual([
                'set_state',
                'start_scan',
                'stop_scan',
                'set_state',
                'start_scan',
                'stop_scan',
            ]);
        });

        it('runs a call after a failed one', async () => {
            connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            const [first, second] = await Promise.all([
                ipc.init({ knownDevices }),
                ipc.init({ knownDevices }),
            ]);

            expect(first).toMatchObject({ success: false });
            expect(second).toEqual({ success: true });
        });

        it('sends known devices to a client created before init', async () => {
            await ipc.getInfo();
            sendMock.mockClear();

            await ipc.init({ knownDevices });

            expect(sendMock).toHaveBeenCalledWith({
                method: 'set_state',
                params: { devices: knownDevices },
            });
        });

        it('sends changed known devices to a connected client', async () => {
            await ipc.init({ knownDevices });
            sendMock.mockClear();

            await ipc.init({ knownDevices: [] });

            expect(sendMock.mock.calls.map(([request]) => request)).toEqual([
                { method: 'set_state', params: { devices: [] } },
            ]);
        });

        it('waits for a connection in flight before syncing known devices', async () => {
            const connectDeferred = createDeferred<void>();
            connectMock.mockImplementationOnce(async () => {
                await connectDeferred.promise;
                isConnectedMock.mockReturnValue(true);
            });

            const info = ipc.getInfo();
            const init = ipc.init({ knownDevices });
            connectDeferred.resolve();
            await Promise.all([info, init]);

            expect(connectMock).toHaveBeenCalledTimes(1);
            expect(
                sendMock.mock.calls
                    .filter(([request]) => request.method === 'set_state')
                    .at(-1)?.[0],
            ).toEqual({ method: 'set_state', params: { devices: knownDevices } });
        });

        it('returns the connection failure', async () => {
            connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            await expect(ipc.init({ knownDevices })).resolves.toEqual({
                success: false,
                error: { message: 'ECONNREFUSED', code: 'Bluetooth_Error' },
            });
        });

        it('returns the set_state failure for a connected client', async () => {
            await ipc.init({ knownDevices });
            sendMock.mockRejectedValueOnce(new Error('set_state failed'));

            await expect(ipc.init({ knownDevices: [] })).resolves.toEqual({
                success: false,
                error: { message: 'set_state failed', code: 'Bluetooth_Error' },
            });
        });
    });

    describe('dispose', () => {
        it('disposes the client', async () => {
            await ipc.getInfo();

            await expect(ipc.dispose()).resolves.toEqual({ success: true });

            expect(disposeMock).toHaveBeenCalledTimes(1);
            expect(ipc['api']).toBeUndefined();
        });

        it('drops the scan intent and connects again on next use', async () => {
            await ipc.startScan('ui');
            await ipc.dispose();
            sendMock.mockClear();

            await ipc.getInfo();

            expect(connectMock).toHaveBeenCalledTimes(2);
            expect(methods()).toEqual(['set_state', 'get_info']);
        });

        it('does nothing when the client was never created', async () => {
            await expect(ipc.dispose()).resolves.toEqual({ success: true });

            expect(connectMock).not.toHaveBeenCalled();
            expect(disposeMock).not.toHaveBeenCalled();
        });

        it('does not leave a client created by a queued startScan', async () => {
            const start = ipc.startScan('ui');
            const disposed = ipc.dispose();
            await Promise.all([start, disposed]);

            expect(ipc['api']).toBeUndefined();
            expect(disposeMock).toHaveBeenCalledTimes(1);
        });

        it('waits for a connection in flight so it is not leaked', async () => {
            const connectDeferred = createDeferred<void>();
            connectMock.mockImplementationOnce(async () => {
                await connectDeferred.promise;
                isConnectedMock.mockReturnValue(true);
            });

            const info = ipc.getInfo();
            const disposed = ipc.dispose();
            connectDeferred.resolve();
            await Promise.all([info, disposed]);

            expect(disposeMock).toHaveBeenCalledTimes(1);
            expect(ipc['api']).toBeUndefined();
        });
    });
});
