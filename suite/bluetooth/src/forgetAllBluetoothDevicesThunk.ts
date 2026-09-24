import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { type WithServices, createThunk } from '@suite-common/redux-utils';

import { type BluetoothDep } from './bluetoothServiceTypes';

type ForgetAllBluetoothDevicesThunkDeps = WithServices<BluetoothDep>;

export const forgetAllBluetoothDevicesThunk = createThunk<
    void,
    void,
    { extra: ForgetAllBluetoothDevicesThunkDeps }
>(`${BLUETOOTH_PREFIX}/forgetAllBluetoothDevicesThunk`, (_, { dispatch, extra }) => {
    dispatch(bluetoothActions.knownDevicesUpdateAction({ knownDevices: [] }));

    extra.services.bluetooth.restartBackgroundScan();
});
