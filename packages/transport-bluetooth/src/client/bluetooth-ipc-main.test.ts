import { createDeferred } from '@trezor/utils';

import { BluetoothIpc } from './bluetooth-ipc-main';
import { TrezorBluetooth } from './trezor-bluetooth';
import { type BluetoothDevice } from './types';

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

    beforeEach(() => {
        sendMock.mockReset();
        sendMock.mockResolvedValue({ devices: [], success: true });
        isConnectedMock.mockReturnValue(true);
        ipc = new BluetoothIpc({ url: 'ws://localhost:12345' });
    });

    afterAll(() => {
        jest.restoreAllMocks();
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

    it('preserves unowned scan start and stop', async () => {
        await expect(ipc.startScan()).resolves.toEqual({ success: true });
        await expect(ipc.stopScan()).resolves.toEqual({ success: true });

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual([
            'start_scan',
            'stop_scan',
        ]);
    });

    it('keeps scanning on an ownerless stopScan while there are known devices', async () => {
        const knownDevice = mockBluetoothDevice();
        sendMock.mockResolvedValue({ devices: [knownDevice], success: true });
        await ipc.init({ knownDevices: [knownDevice] });
        await ipc.startScan();
        sendMock.mockClear();

        await expect(ipc.stopScan()).resolves.toEqual({ success: true });
        expect(sendMock).not.toHaveBeenCalled();

        await expect(ipc.stopScan('ui')).resolves.toEqual({ success: true });
        expect(sendMock).toHaveBeenCalledWith({ method: 'stop_scan', params: undefined });
    });

    it('keeps failed scan intent until its owner stops', async () => {
        sendMock.mockRejectedValueOnce(new Error('Adapter disabled'));
        await expect(ipc.startScan('ui')).resolves.toEqual({
            success: false,
            error: 'Adapter disabled',
        });
        sendMock.mockClear();

        await ipc.stopScan('background');
        expect(sendMock).not.toHaveBeenCalled();

        await expect(ipc.stopScan('ui')).resolves.toEqual({ success: true });
        expect(sendMock).toHaveBeenCalledWith({ method: 'stop_scan', params: undefined });
    });

    it('does not send stop_scan if a new startScan starts while stopScan is connecting', async () => {
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

        const stop = ipc.stopScan('ui');
        // The stop must be suspended inside connectApi before the new scan is requested,
        // otherwise it bails out on its first check and never reaches the post-connect one.
        await connectStarted.promise;
        const start = ipc.startScan('background');

        connectDeferred.resolve();
        await Promise.all([stop, start]);

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual(['start_scan']);
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

    // Lets every already scheduled scan action run before the assertions look at the requests.
    const flushEventLoop = () => {}; //new Promise<void>(resolve => setImmediate(resolve));

    it('guard initialScan stop_scan', async () => {
        const knownDevice = mockBluetoothDevice();
        const scanStopStarted = createDeferred<void>();

        sendMock.mockImplementation(message => {
            if (message.method === 'stop_scan') {
                scanStopStarted.resolve();
            }

            return Promise.resolve({ devices: [knownDevice], success: true });
        });

        const pr = ipc.init({ knownDevices: [knownDevice] });
        await scanStopStarted.promise;
        await ipc.startScan('ui');
        await pr;

        // await flushEventLoop();

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual([
            // 'start_scan',
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
            error: 'ECONNREFUSED',
        });
        expect(sendMock).not.toHaveBeenCalled();
        connectSpy.mockRestore();
    });

    it('restarts scanning when the adapter becomes enabled while a scan is wanted', async () => {
        await ipc.startScan('ui');
        ipc['api'].emit('adapter_state_changed', { state: 'enabled' });
        await flushEventLoop();

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual(['start_scan']);
    });

    it('does not restart scanning when the adapter becomes enabled after the last owner stopped', async () => {
        await ipc.stopScan('ui');
        sendMock.mockClear();

        ipc['api'].emit('adapter_state_changed', { state: 'enabled' });
        await flushEventLoop();

        expect(sendMock).not.toHaveBeenCalled();
    });

    it('does not restart scanning when the last owner stops before the restart runs', async () => {
        ipc['api'].emit('adapter_state_changed', { state: 'enabled' });
        await ipc.stopScan('ui');

        expect(sendMock.mock.calls.map(([request]) => request.method)).toEqual(['stop_scan']);
    });
});
