import {
    BLUETOOTH_PREFIX,
    type ForgetBluetoothDeviceThunkParams,
    bluetoothActions,
} from '@suite-common/bluetooth';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { bluetoothDisconnectDeviceThunk } from './bluetoothDisconnectDeviceThunk';
import { setIsUnpairingDevice } from './desktopBluetoothReducer';

export const forgetBluetoothDeviceThunk = createThunk<void, ForgetBluetoothDeviceThunkParams, void>(
    `${BLUETOOTH_PREFIX}/forgetBluetoothDevice`,
    async (
        { bluetoothId, skipDisconnect, skipToggleModalConnection, isOsUnpairingFinished },
        { dispatch },
    ) => {
        dispatch(setIsUnpairingDevice({ isUnpairing: true }));
        if (!skipDisconnect) {
            await dispatch(bluetoothDisconnectDeviceThunk({ id: bluetoothId }));
        }
        const resultForget = await bluetoothIpc.forgetDevice(bluetoothId);
        dispatch(setIsUnpairingDevice({ isUnpairing: false }));
        if (!resultForget.success && !isOsUnpairingFinished) {
            dispatch(
                bluetoothActions.setIsDeviceOsUnpairingRequired(true, {
                    skipToggleModalConnection,
                }),
            );
        }
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
    },
);

type UnpairCurrentBondThunkParams = Record<never, never>;

/**
 * Sends bleUnpair command to the Trezor device and cleans up BT state on success.
 * Does NOT trigger the global OS removal modal or forgetBluetoothDeviceThunk.
 * Returns whether the unpair was successful.
 */
export const unpairCurrentBondThunk = createThunk<boolean, UnpairCurrentBondThunkParams, void>(
    `${BLUETOOTH_PREFIX}/unpairCurrentBond`,
    async (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());

        if (!device) return false;

        const result = await TrezorConnect.bleUnpair({ device, all: false });
        if (
            result.success ||
            result.error.code === 'Device_Disconnected' // This is an expected success
        ) {
            return true;
        }

        dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));

        return false;
    },
);
