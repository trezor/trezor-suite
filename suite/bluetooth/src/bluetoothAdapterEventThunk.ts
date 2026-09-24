import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { type WithServices, createThunk } from '@suite-common/redux-utils';

import { type BluetoothDep } from './bluetoothServiceTypes';

type BluetoothAdapterEventThunkDeps = WithServices<BluetoothDep>;

export const bluetoothAdapterEventThunk = createThunk<
    void,
    Parameters<typeof bluetoothActions.adapterEventAction>[0],
    { extra: BluetoothAdapterEventThunkDeps }
>(`${BLUETOOTH_PREFIX}/bluetoothAdapterEventThunk`, (params, { dispatch, extra }) => {
    dispatch(bluetoothActions.adapterEventAction(params));

    extra.services.bluetooth.restartBackgroundScan();
});
