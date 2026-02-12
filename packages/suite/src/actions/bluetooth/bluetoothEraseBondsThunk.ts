import {
    BLUETOOTH_PREFIX,
    ForgetBluetoothDeviceThunkParams,
    bluetoothActions,
} from '@suite-common/bluetooth';
import { selectDeviceBluetoothId, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { BluetoothDeviceId } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { bluetoothDisconnectDeviceThunk } from './bluetoothDisconnectDeviceThunk';
import { setIsUnpairingDevice } from './desktopBluetoothReducer';

export const forgetBluetoothDeviceThunk = createThunk<void, ForgetBluetoothDeviceThunkParams, void>(
    `${BLUETOOTH_PREFIX}/forgetBluetoothDevice`,
    async ({ bluetoothId, suppressOsUnpairingModal }, { dispatch }) => {
        dispatch(setIsUnpairingDevice({ isUnpairing: true }));
        await dispatch(bluetoothDisconnectDeviceThunk({ id: bluetoothId }));
        const resultForget = await bluetoothIpc.forgetDevice(bluetoothId);
        dispatch(setIsUnpairingDevice({ isUnpairing: false }));
        if (!resultForget.success && !suppressOsUnpairingModal) {
            dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(true));
        }
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
    },
);

type UnpairCurrentBondThunkParams = {
    bluetoothId: BluetoothDeviceId;
    // When true, skip calling bluetoothDisconnectDeviceThunk after bleUnpair.
    // Used when bleUnpair already disconnects the peripheral, making the
    // explicit disconnect fail with "Peripheral not found".
    skipDisconnect?: boolean;
};

/**
 * Sends bleUnpair command to the Trezor device and cleans up BT state on success.
 * Does NOT trigger the global OS removal modal or forgetBluetoothDeviceThunk.
 * Returns whether the unpair was successful.
 */
export const unpairCurrentBondThunk = createThunk<boolean, UnpairCurrentBondThunkParams, void>(
    `${BLUETOOTH_PREFIX}/unpairCurrentBond`,
    async ({ bluetoothId, skipDisconnect }, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());

        if (!device) return false;

        const result = await TrezorConnect.bleUnpair({ device, all: false });
        if (
            result.success ||
            result.error.code === 'Device_Disconnected' // This is an expected success
        ) {
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
            if (!skipDisconnect) {
                await dispatch(forgetBluetoothDeviceThunk({ bluetoothId }));
            }

            return true;
        }

        dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));

        return false;
    },
);

export const bluetoothEraseBondsThunk = createThunk(
    `${BLUETOOTH_PREFIX}/bluetoothEraseBondsThunk`,
    async (_, { dispatch, getState }) => {
        const bluetoothId = selectDeviceBluetoothId(getState());

        if (bluetoothId) {
            const success = await dispatch(unpairCurrentBondThunk({ bluetoothId })).unwrap();
            if (success) {
                await dispatch(forgetBluetoothDeviceThunk({ bluetoothId }));
            }
        }
    },
);
