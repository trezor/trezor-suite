/**
 * @jest-environment jsdom
 */

import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { type IpcResponse, bluetoothIpc } from '@trezor/transport-bluetooth';
import { createDeferred } from '@trezor/utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import {
    type BackgroundScan,
    type BackgroundScanDeps,
    createBackgroundScan,
} from './bluetoothBackgroundScan';
import {
    type WithBluetoothRootState,
    initialDesktopBluetoothState,
} from './desktopBluetoothReducer';

const disconnectedDevice: DesktopBluetoothDevice = {
    id: asBluetoothDeviceId('test-device'),
    name: 'Test device',
    macAddress: '',
    lastUpdatedTimestamp: 0,
    connectionStatus: { type: 'disconnected' },
    manufacturerData: {
        deviceModel: DeviceModelInternal.T3W1,
        deviceColor: 0,
        filterPolicy: undefined,
    },
};

describe('createBackgroundScan', () => {
    let state: WithBluetoothRootState;
    let scan: BackgroundScan;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(bluetoothIpc, 'startScan').mockResolvedValue({ success: true });
        jest.spyOn(bluetoothIpc, 'stopScan').mockResolvedValue({ success: true });
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        state = {
            bluetooth: {
                ...initialDesktopBluetoothState,
                adapterStatus: 'enabled',
                knownDevices: [disconnectedDevice],
            },
        };
        const deps: BackgroundScanDeps = { getState: () => state };
        scan = createBackgroundScan(deps);
    });

    afterEach(async () => {
        scan.stop();
        await jest.advanceTimersByTimeAsync(0);
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('scans for 2 seconds every 6 seconds without duplicating an active run', async () => {
        scan.start();
        scan.start();
        scan.restartIfNeeded();

        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledWith('background');
        await jest.advanceTimersByTimeAsync(1999);
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
        await jest.advanceTimersByTimeAsync(1);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledWith('background');
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(3999);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
    });

    it.each(['none', 'connected', 'connecting', 'paired', 'pairing'] as const)(
        'does not scan when known devices are %s',
        async status => {
            state.bluetooth = {
                ...state.bluetooth,
                knownDevices:
                    status === 'none'
                        ? []
                        : [{ ...disconnectedDevice, connectionStatus: { type: status } }],
            };

            scan.start();
            await jest.advanceTimersByTimeAsync(12000);

            expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
            expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
        },
    );

    it.each([
        'unknown',
        'disabled',
        'permission-denied',
        'not-compatible',
        'power-suspending',
    ] as const)('does not scan when the adapter is %s', async adapterStatus => {
        state.bluetooth = { ...state.bluetooth, adapterStatus };

        scan.start();
        scan.restartIfNeeded();
        await jest.advanceTimersByTimeAsync(12000);

        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('uses the latest adapter status before another cycle and can restart when enabled', async () => {
        scan.start();
        await jest.advanceTimersByTimeAsync(2000);
        state.bluetooth = { ...state.bluetooth, adapterStatus: 'disabled' };

        await jest.advanceTimersByTimeAsync(10000);

        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        state.bluetooth = { ...state.bluetooth, adapterStatus: 'enabled' };
        scan.restartIfNeeded();
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
    });

    it('uses the latest device state when deciding whether to start another cycle', async () => {
        scan.start();
        await jest.advanceTimersByTimeAsync(2000);
        state.bluetooth = { ...state.bluetooth, knownDevices: [] };

        await jest.advanceTimersByTimeAsync(10000);

        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        state.bluetooth = { ...state.bluetooth, knownDevices: [disconnectedDevice] };
        scan.restartIfNeeded();
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
    });

    it('stops an active scan when no disconnected devices remain', async () => {
        scan.start();
        await jest.advanceTimersByTimeAsync(0);
        state.bluetooth = { ...state.bluetooth, knownDevices: [] };

        scan.restartIfNeeded();
        await jest.advanceTimersByTimeAsync(12000);

        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it.each([0, 1000, 3000])('cancels safely after %i milliseconds', async elapsed => {
        scan.stop();
        scan.start();
        await jest.advanceTimersByTimeAsync(elapsed);

        scan.stop();
        scan.stop();
        await jest.advanceTimersByTimeAsync(12000);

        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('waits for the old scan to release its owner before restarting', async () => {
        const stopping = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.stopScan).mockReturnValueOnce(stopping.promise);
        scan.start();
        await jest.advanceTimersByTimeAsync(0);

        scan.stop();
        scan.start();
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        stopping.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(0);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
    });

    it('releases a pending start without scheduling another scan after cancellation', async () => {
        const starting = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.startScan).mockReturnValueOnce(starting.promise);

        scan.start();
        scan.stop();
        starting.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(12000);

        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('includes IPC latency in the six-second cadence', async () => {
        const starting = createDeferred<IpcResponse>();
        jest.mocked(bluetoothIpc.startScan).mockReturnValueOnce(starting.promise);
        scan.start();
        await jest.advanceTimersByTimeAsync(1000);

        starting.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(2000);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(2999);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
    });

    it('skips hidden-window cycles and resumes when the window becomes visible', async () => {
        const visibility = jest.spyOn(document, 'visibilityState', 'get');
        visibility.mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));

        scan.start();
        await jest.advanceTimersByTimeAsync(12000);
        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
        expect(bluetoothIpc.stopScan).not.toHaveBeenCalled();

        visibility.mockReturnValue('visible');
        document.dispatchEvent(new Event('visibilitychange'));
        await jest.advanceTimersByTimeAsync(6000);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
    });

    it('skips cycles when the window was already hidden before the scan was created', async () => {
        jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        scan = createBackgroundScan({ getState: () => state });

        scan.start();
        await jest.advanceTimersByTimeAsync(12000);

        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
    });

    it.each([
        ['startScan', '[Bluetooth BackgroundScan] start_scan failed'],
        ['stopScan', '[Bluetooth BackgroundScan] stop_scan failed'],
    ] as const)(
        'reports an unsuccessful %s response and continues scanning',
        async (method, warning) => {
            jest.mocked(bluetoothIpc[method]).mockResolvedValueOnce({
                success: false,
                error: 'test-error',
            });

            scan.start();
            await jest.advanceTimersByTimeAsync(6000);

            expect(console.warn).toHaveBeenCalledWith(warning);
            expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
            expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
        },
    );

    it.each([
        ['startScan', '[Bluetooth BackgroundScan] scanning failed'],
        ['stopScan', '[Bluetooth BackgroundScan] stop_scan failed'],
    ] as const)('handles a rejected %s request and continues scanning', async (method, warning) => {
        jest.mocked(bluetoothIpc[method]).mockRejectedValueOnce(new Error('test-error'));

        scan.start();
        await jest.advanceTimersByTimeAsync(6000);

        expect(console.warn).toHaveBeenCalledWith(warning);
        expect(bluetoothIpc.stopScan).toHaveBeenCalledTimes(1);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
    });
});
