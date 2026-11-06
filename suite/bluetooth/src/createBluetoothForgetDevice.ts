import { type Dispatch } from '@reduxjs/toolkit';

import { type ForgetBluetoothDeviceThunkParams, bluetoothActions } from '@suite-common/bluetooth';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { setIsUnpairingDevice } from './desktopBluetoothReducer';

type BluetoothForgetDeviceDeps = {
    dispatch: Dispatch;
    disconnectDevice: BluetoothDisconnectDevice;
};

// Params type comes from @suite-common/bluetooth, shared with the thunk wired into @suite-common/device.
export type BluetoothForgetDevice = (params: ForgetBluetoothDeviceThunkParams) => Promise<void>;

export const createBluetoothForgetDevice =
    (deps: BluetoothForgetDeviceDeps): BluetoothForgetDevice =>
    async params => {
        deps.dispatch(setIsUnpairingDevice({ isUnpairing: true }));
        if (!params.skipDisconnect) {
            await deps.disconnectDevice(params.bluetoothId);
        }

        const resultForget = await bluetoothIpc.forgetDevice(params.bluetoothId);
        deps.dispatch(setIsUnpairingDevice({ isUnpairing: false }));

        if (!resultForget.success && !params.isOsUnpairingFinished) {
            deps.dispatch(
                bluetoothActions.setIsDeviceOsUnpairingRequired(true, {
                    skipToggleModalConnection: params.skipToggleModalConnection,
                }),
            );
        }
        deps.dispatch(bluetoothActions.removeKnownDeviceAction({ id: params.bluetoothId }));
    };
