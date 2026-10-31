import { BLUETOOTH_PREFIX, type ForgetBluetoothDeviceThunkParams } from '@suite-common/bluetooth';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { type BluetoothDep } from './createBluetooth';

type ForgetBluetoothDeviceThunkDeps = WithServices<BluetoothDep>;

// NOTE: this thunk needs to stay,
// it's being wired via extraDependencies to @suite-common/device forgetSingleDevicePersistentDataThunk
export const forgetBluetoothDeviceThunk = createThunk<
    void,
    ForgetBluetoothDeviceThunkParams,
    { extra: ForgetBluetoothDeviceThunkDeps }
>(`${BLUETOOTH_PREFIX}/forgetBluetoothDevice`, (params, { extra }) =>
    extra.services.bluetooth.forgetDevice(params),
);
