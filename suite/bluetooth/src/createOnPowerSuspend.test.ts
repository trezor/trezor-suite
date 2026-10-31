import { bluetoothActions } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';

import { type OnPowerSuspendDeps, createOnPowerSuspend } from './createOnPowerSuspend';
import { mockBackgroundScan } from '../mocks/mockBackgroundScan';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

const device = (
    id: string,
    type: 'connected' | 'connecting' | 'paired' | 'pairing' | 'disconnected',
) => mockDesktopBluetoothDevice({ id: asBluetoothDeviceId(id), connectionStatus: { type } });

describe('createOnPowerSuspend', () => {
    it('dispatches power-suspending, stops scan and disconnects only reachable devices', () => {
        const deps = createMockDeps<OnPowerSuspendDeps>({
            dispatch: action => action,
            disconnectDevice: () => Promise.resolve(),
            backgroundScan: mockBackgroundScan(),
            getKnownDevices: () => [
                device('a', 'connected'),
                device('b', 'disconnected'),
                device('c', 'connecting'),
            ],
        });
        const onPowerSuspend = createOnPowerSuspend(deps);

        onPowerSuspend();

        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.adapterEventAction({ status: 'power-suspending' }),
        );
        expect(deps.backgroundScan.stop).toHaveBeenCalledTimes(1);
        expect(deps.disconnectDevice.mock.calls).toEqual([['a'], ['c']]);
    });
});
