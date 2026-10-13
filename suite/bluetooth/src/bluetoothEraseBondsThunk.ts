import { BLUETOOTH_PREFIX, type ForgetBluetoothDeviceThunkParams } from '@suite-common/bluetooth';
import { type WithServices, createThunk } from '@suite-common/redux-utils';

import { type BluetoothDep } from './createBluetooth';

type ForgetBluetoothDeviceThunkDeps = WithServices<BluetoothDep>;

// NOTE: this thunk exists only because its being shared via extraDependencies to @suite-common/device forgetSingleDevicePersistentDataThunk
export const forgetBluetoothDeviceThunk = createThunk<
    void,
    ForgetBluetoothDeviceThunkParams,
    { extra: ForgetBluetoothDeviceThunkDeps }
>(`${BLUETOOTH_PREFIX}/forgetBluetoothDevice`, (params, { extra }) =>
    extra.services.bluetooth.forgetDevice(params),
);
