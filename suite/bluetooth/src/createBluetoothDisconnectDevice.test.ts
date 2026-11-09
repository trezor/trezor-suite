import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { createBluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { stopConnectingBluetoothDevice } from './desktopBluetoothReducer';
import { mockBackgroundScan } from '../mocks/mockBackgroundScan';

const deviceId = asBluetoothDeviceId('bt-id');

describe('createBluetoothDisconnectDevice', () => {
    const setup = (success: boolean) => {
        const dispatch = jest.fn();
        const backgroundScan = mockBackgroundScan();
        jest.spyOn(bluetoothIpc, 'disconnectDevice').mockResolvedValue(
            success ? { success: true } : ({ success: false, error: { message: 'boom' } } as any),
        );

        return {
            run: createBluetoothDisconnectDevice(createMockDeps({ dispatch, backgroundScan })),
            dispatch,
            backgroundScan,
        };
    };

    afterEach(() => jest.restoreAllMocks());

    it('only stops the connecting state on success', async () => {
        const { run, dispatch, backgroundScan } = setup(true);
        await run(deviceId);
        expect(dispatch.mock.calls.map(c => c[0])).toEqual([
            stopConnectingBluetoothDevice({ deviceId }),
        ]);
        expect(backgroundScan.restartIfNeeded).not.toHaveBeenCalled();
    });

    it('marks disconnected, restarts scan and toasts on failure', async () => {
        const { run, dispatch, backgroundScan } = setup(false);
        await run(deviceId);
        expect(dispatch.mock.calls.map(c => c[0])).toEqual([
            bluetoothActions.updateDeviceConnectionStatus({
                deviceId,
                connectionStatus: { type: 'disconnected' },
            }),
            notificationsActions.addToast({ type: 'error', error: 'boom' }),
            stopConnectingBluetoothDevice({ deviceId }),
        ]);
        expect(backgroundScan.restartIfNeeded).toHaveBeenCalledTimes(1);
    });
});
