import {
    BLUETOOTH_PREFIX,
    type WithBluetoothState,
    bluetoothActions,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type DesktopBluetoothDevice, toBluetoothDevice } from './DesktopBluetoothDevice';
import { isBluetoothDeviceReachable } from './isBluetoothDeviceReachable';

type InitBluetoothThunkState = WithBluetoothState<DesktopBluetoothDevice>;

export const initBluetoothThunk = createThunk<void, void, { state: InitBluetoothThunkState }>(
    `${BLUETOOTH_PREFIX}/initBluetoothThunk`,
    async (_, { getState, dispatch }) => {
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

        const result = await bluetoothIpc.init({
            knownDevices: knownDevices.map(device => ({
                ...toBluetoothDevice(device),
                ...{ connected: isBluetoothDeviceReachable(device) },
            })),
        });

        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Unable to initialize Bluetooth Module.',
                }),
            );

            return;
        }

        // NOTE: getInfo when adapter is disabled adapter may return different result in adapter_info field
        const apiInfo = await bluetoothIpc.getInfo();
        if (apiInfo.success) {
            dispatch(
                bluetoothActions.adapterEventAction({
                    status: apiInfo.payload.state,
                }),
            );
        }
    },
);
