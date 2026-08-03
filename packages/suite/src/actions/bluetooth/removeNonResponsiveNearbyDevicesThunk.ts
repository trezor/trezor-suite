import {
    BLUETOOTH_PREFIX,
    type WithBluetoothState,
    bluetoothActions,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { filterOutNonResponsiveDevices } from './filterOutNonResponsiveDevices';

export const removeNonResponsiveNearbyDevicesThunk = createThunk<
    void,
    void,
    { state: WithBluetoothState<DesktopBluetoothDevice>; extra: Record<never, never> }
>(`${BLUETOOTH_PREFIX}/removeNonResponsiveNearbyDevicesThunk`, (_, { dispatch, getState }) => {
    const nearbyDevices = selectNearbyDevices<DesktopBluetoothDevice>(getState());

    dispatch(
        bluetoothActions.nearbyDevicesUpdateAction({
            nearbyDevices: filterOutNonResponsiveDevices(nearbyDevices),
        }),
    );
});
