import TrezorConnect, { type Device, asDeviceUniquePath } from '@trezor/connect';
import { type IpcResponse, bluetoothIpc } from '@trezor/transport-bluetooth';
import { createDeferred } from '@trezor/utils';

import { createFirmwareUpdateScan } from './bluetoothFirmwareUpdateScan';
import { type FirmwareUpdateScan } from './bluetoothServiceTypes';

const device: Device = {
    type: 'unacquired',
    path: asDeviceUniquePath('test-path'),
    name: 'Test device',
    label: 'Unacquired device',
    descriptor: { apiType: 'bluetooth', id: 'test-device' },
};

const getDeviceConnectListener = () => {
    const registration = jest
        .mocked(TrezorConnect.on)
        .mock.calls.find(([event]) => event === 'device-connect');
    if (!registration) {
        throw new Error('Expected a device-connect listener to be registered.');
    }

    return registration[1];
};

describe('startFirmwareUpdateScan', () => {
    let scan: FirmwareUpdateScan;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(TrezorConnect, 'on').mockImplementation(() => {});
        jest.spyOn(TrezorConnect, 'off').mockImplementation(() => {});
        jest.spyOn(bluetoothIpc, 'disconnectDevice').mockResolvedValue({ success: true });
        jest.spyOn(bluetoothIpc, 'startScan').mockResolvedValue({ success: true });
        jest.spyOn(bluetoothIpc, 'stopScan').mockResolvedValue({ success: true });
        scan = createFirmwareUpdateScan();
    });

    afterEach(async () => {
        scan.stop();
        await jest.advanceTimersByTimeAsync(0);
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('disconnects the device before starting a firmware-update scan', async () => {
        const disconnecting = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.disconnectDevice).mockReturnValueOnce(disconnecting.promise);

        scan.start('test-device');

        expect(TrezorConnect.on).toHaveBeenCalledWith('device-connect', expect.any(Function));
        expect(bluetoothIpc.disconnectDevice).toHaveBeenCalledWith('test-device');
        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();

        disconnecting.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledWith('firmware-update');
    });

    it('stops scanning and removes the connection listener exactly once', async () => {
        scan.stop();
        expect(TrezorConnect.off).not.toHaveBeenCalled();
        scan.start('test-device');
        await jest.advanceTimersByTimeAsync(0);
        const listener = getDeviceConnectListener();

        scan.stop();
        scan.stop();

        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
        expect(TrezorConnect.off).toHaveBeenCalledWith('device-connect', listener);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledWith('firmware-update');
    });

    it('cancels a pending disconnect without starting or stopping an unstarted scan', async () => {
        const disconnecting = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.disconnectDevice).mockReturnValueOnce(disconnecting.promise);
        scan.start('test-device');

        scan.stop();
        disconnecting.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(0);

        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
    });

    it('stops when the target reconnects over Bluetooth, ignoring other connections', async () => {
        scan.start('test-device');
        await jest.advanceTimersByTimeAsync(0);
        const onDeviceConnect = getDeviceConnectListener();

        onDeviceConnect({ ...device, descriptor: { apiType: 'usb', id: 'test-device' } });
        onDeviceConnect({ ...device, descriptor: { apiType: 'bluetooth', id: 'other-device' } });
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
        expect(TrezorConnect.off).not.toHaveBeenCalled();

        onDeviceConnect(device);
        scan.stop();

        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(TrezorConnect.off).toHaveBeenCalledWith('device-connect', onDeviceConnect);
        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
    });

    it('cancels when the target reconnects while disconnect is still pending', async () => {
        const disconnecting = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.disconnectDevice).mockReturnValueOnce(disconnecting.promise);
        scan.start('test-device');
        const onDeviceConnect = getDeviceConnectListener();

        onDeviceConnect(device);
        disconnecting.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(0);

        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
    });

    it('replaces an active scan and starts scanning for the new device', async () => {
        scan.start('first-device');
        await jest.advanceTimersByTimeAsync(0);
        const firstListener = getDeviceConnectListener();

        scan.start('second-device');
        await jest.advanceTimersByTimeAsync(0);

        expect(TrezorConnect.off).toHaveBeenCalledWith('device-connect', firstListener);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.disconnectDevice).toHaveBeenNthCalledWith(2, 'second-device');
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
    });

    it('does not let a replaced pending request start a stale scan', async () => {
        const disconnecting = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.disconnectDevice).mockReturnValueOnce(disconnecting.promise);
        scan.start('first-device');
        scan.start('second-device');
        await jest.advanceTimersByTimeAsync(0);

        disconnecting.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
    });

    it.each(['response', 'rejection'])('cleans up a failed disconnect (%s)', async failure => {
        if (failure === 'response') {
            jest.mocked(bluetoothIpc.disconnectDevice).mockResolvedValueOnce({
                success: false,
                error: 'test-error',
            });
        } else {
            jest.mocked(bluetoothIpc.disconnectDevice).mockRejectedValueOnce(
                new Error('test-error'),
            );
        }

        scan.start('test-device');
        await jest.advanceTimersByTimeAsync(0);

        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
    });

    it.each(['response', 'rejection'])('cleans up a failed scan start (%s)', async failure => {
        if (failure === 'response') {
            jest.mocked(bluetoothIpc.startScan).mockResolvedValueOnce({
                success: false,
                error: 'test-error',
            });
        } else {
            jest.mocked(bluetoothIpc.startScan).mockRejectedValueOnce(new Error('test-error'));
        }

        scan.start('test-device');
        await jest.advanceTimersByTimeAsync(0);

        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
    });

    it('cleans up when a pending scan start rejects after cancellation', async () => {
        const starting = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.startScan).mockReturnValueOnce(starting.promise);
        scan.start('test-device');
        await jest.advanceTimersByTimeAsync(0);

        scan.stop();
        starting.reject(new Error('test-error'));
        await jest.advanceTimersByTimeAsync(0);

        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
    });

    it.each(['response', 'rejection'])('reports a failed stop request (%s)', async failure => {
        if (failure === 'response') {
            jest.mocked(bluetoothIpc.stopScan).mockResolvedValueOnce({
                success: false,
                error: 'test-error',
            });
        } else {
            jest.mocked(bluetoothIpc.stopScan).mockRejectedValueOnce(new Error('test-error'));
        }
        scan.start('test-device');
        await jest.advanceTimersByTimeAsync(0);

        scan.stop();
        await jest.advanceTimersByTimeAsync(0);

        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
    });
});
