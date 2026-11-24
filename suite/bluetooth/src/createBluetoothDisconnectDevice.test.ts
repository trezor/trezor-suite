import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    type BluetoothDisconnectDeviceDeps,
    createBluetoothDisconnectDevice,
} from './createBluetoothDisconnectDevice';
import { stopConnectingBluetoothDevice } from './desktopBluetoothReducer';
import { mockBackgroundScan } from '../mocks/mockBackgroundScan';

const deviceId = asBluetoothDeviceId('bt-id');

describe('createBluetoothDisconnectDevice', () => {
    const setup = (success: boolean) => {
        const deps = createMockDeps<BluetoothDisconnectDeviceDeps>({
            dispatch: action => action,
            backgroundScan: mockBackgroundScan(),
            bluetoothIpc: {
                disconnectDevice: () =>
                    Promise.resolve(
                        success
                            ? { success: true }
                            : { success: false, error: { message: 'boom', code: 'boom' } },
                    ),
            },
        });

        return { run: createBluetoothDisconnectDevice(deps), deps };
    };

    it('only stops the connecting state on success', async () => {
        const { run, deps } = setup(true);
        await run(deviceId);
        expect(deps.dispatch.mock.calls.map(c => c[0])).toEqual([
            stopConnectingBluetoothDevice({ deviceId }),
        ]);
        expect(deps.backgroundScan.restartIfNeeded).not.toHaveBeenCalled();
    });

    it('marks disconnected, restarts scan and toasts on failure', async () => {
        const { run, deps } = setup(false);
        await run(deviceId);
        expect(deps.dispatch.mock.calls.map(c => c[0])).toEqual([
            bluetoothActions.updateDeviceConnectionStatus({
                deviceId,
                connectionStatus: { type: 'disconnected' },
            }),
            notificationsActions.addToast({ type: 'error', error: 'boom' }),
            stopConnectingBluetoothDevice({ deviceId }),
        ]);
        expect(deps.backgroundScan.restartIfNeeded).toHaveBeenCalledTimes(1);
    });
});
