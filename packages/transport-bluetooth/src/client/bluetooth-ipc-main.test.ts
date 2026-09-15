import { createDeferred } from '@trezor/utils';

import { BluetoothIpc } from './bluetooth-ipc-main';
import { TrezorBluetooth } from './trezor-bluetooth';
import { type BluetoothDevice } from './types';

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

        const connectDeferred = createDeferred<void>();
        isConnectedMock.mockReturnValue(false);
        const connectSpy = jest
            .spyOn(TrezorBluetooth.prototype, 'connect')
            .mockImplementationOnce(() => connectDeferred.promise);

        const stop = ipc.stopScan('ui');
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
});
