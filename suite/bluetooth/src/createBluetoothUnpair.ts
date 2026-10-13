import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopDeviceRootState } from '@suite/device';
import { type ForgetBluetoothDeviceThunkParams, bluetoothActions } from '@suite-common/bluetooth';
import { selectSelectedDevice } from '@suite-common/device';
import { type WithServices } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type BackgroundScan } from './bluetoothBackgroundScan';
import { type BluetoothDep } from './createBluetooth';
import { type BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { type WithBluetoothRootState, setIsUnpairingDevice } from './desktopBluetoothReducer';

type BluetoothUnpairRootState = WithBluetoothRootState & DesktopDeviceRootState;

type BluetoothUnpairThunkDispatch = ThunkDispatch<
    BluetoothUnpairRootState,
    WithServices<BluetoothDep>,
    UnknownAction
>;

type BluetoothUnpairDeps = {
    getState: () => BluetoothUnpairRootState;
    dispatch: BluetoothUnpairThunkDispatch;
    backgroundScan: BackgroundScan;
    disconnectDevice: BluetoothDisconnectDevice;
};

export type BluetoothUnpair = {
    forgetDevice: (params: ForgetBluetoothDeviceThunkParams) => Promise<void>;
    forgetAllDevices: () => void;
    unpairCurrentBond: () => Promise<boolean>;
};

const forgetDevice = async (
    deps: BluetoothUnpairDeps,
    params: ForgetBluetoothDeviceThunkParams,
) => {
    deps.dispatch(setIsUnpairingDevice({ isUnpairing: true }));
    if (!params.skipDisconnect) {
        await deps.disconnectDevice({ deviceId: params.bluetoothId });
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

const forgetAllDevices = (deps: BluetoothUnpairDeps) => {
    deps.dispatch(bluetoothActions.knownDevicesUpdateAction({ knownDevices: [] }));

    deps.backgroundScan.restartIfNeeded();
};

/**
 * Sends bleUnpair command to the Trezor device and cleans up BT state on success.
 * Does NOT trigger the global OS removal modal or forgetBluetoothDeviceThunk.
 * Returns whether the unpair was successful.
 */
const unpairCurrentBond = async (deps: BluetoothUnpairDeps): Promise<boolean> => {
    const device = selectSelectedDevice(deps.getState());

    if (!device) return false;

    const result = await TrezorConnect.bleUnpair({ device, all: false });
    if (
        result.success ||
        result.error.code === 'Device_Disconnected' // This is an expected success
    ) {
        return true;
    }

    deps.dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));

    return false;
};

export const createBluetoothUnpair = (deps: BluetoothUnpairDeps): BluetoothUnpair => ({
    forgetDevice: params => forgetDevice(deps, params),
    forgetAllDevices: () => forgetAllDevices(deps),
    unpairCurrentBond: () => unpairCurrentBond(deps),
});
