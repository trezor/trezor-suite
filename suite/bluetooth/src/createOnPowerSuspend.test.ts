import { bluetoothActions } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';

import { createOnPowerSuspend } from './createOnPowerSuspend';
import { mockBackgroundScan } from '../mocks/mockBackgroundScan';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

const device = (
    id: string,
    type: 'connected' | 'connecting' | 'paired' | 'pairing' | 'disconnected',
) => mockDesktopBluetoothDevice({ id: asBluetoothDeviceId(id), connectionStatus: { type } });

describe('createOnPowerSuspend', () => {
    it('dispatches power-suspending, stops scan and disconnects only reachable devices', () => {
        const dispatch = jest.fn();
        const disconnectDevice = jest.fn().mockResolvedValue(undefined);
        const backgroundScan = mockBackgroundScan();
        const onPowerSuspend = createOnPowerSuspend(
            createMockDeps({
                dispatch,
                disconnectDevice,
                backgroundScan,
                getKnownDevices: () => [
                    device('a', 'connected'),
                    device('b', 'disconnected'),
                    device('c', 'connecting'),
                ],
            }),
        );

        onPowerSuspend();

        expect(dispatch).toHaveBeenCalledWith(
            bluetoothActions.adapterEventAction({ status: 'power-suspending' }),
        );
        expect(backgroundScan.stop).toHaveBeenCalledTimes(1);
        expect(disconnectDevice.mock.calls).toEqual([['a'], ['c']]);
    });
});
