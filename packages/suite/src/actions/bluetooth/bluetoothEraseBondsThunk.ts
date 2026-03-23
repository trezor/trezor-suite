import {
    BLUETOOTH_PREFIX,
    type ForgetBluetoothDeviceThunkParams,
    bluetoothActions,
} from '@suite-common/bluetooth';
import {
    selectDeviceBluetoothId,
    selectIsDeviceConnectedViaBluetooth,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { type BluetoothDeviceId } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { bluetoothDisconnectDeviceThunk } from './bluetoothDisconnectDeviceThunk';
import { setIsUnpairingDevice } from './desktopBluetoothReducer';

export const forgetBluetoothDeviceThunk = createThunk<void, ForgetBluetoothDeviceThunkParams, void>(
    `${BLUETOOTH_PREFIX}/forgetBluetoothDevice`,
    async ({ bluetoothId }, { dispatch }) => {
        dispatch(setIsUnpairingDevice({ isUnpairing: true }));
        await dispatch(bluetoothDisconnectDeviceThunk({ id: bluetoothId }));
        const resultForget = await bluetoothIpc.forgetDevice(bluetoothId);
        dispatch(setIsUnpairingDevice({ isUnpairing: false }));
        if (!resultForget.success) {
            dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(true));
        }
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
    },
);

type UnpairCurrentBondThunkParams = {
    bluetoothId: BluetoothDeviceId;
};

const unpairCurrentBondThunk = createThunk<void, UnpairCurrentBondThunkParams, void>(
    `${BLUETOOTH_PREFIX}/unpairCurrentBond`,
    async ({ bluetoothId }, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());

        if (!device) return;

        const result = await TrezorConnect.bleUnpair({ device, all: false });
        if (
            result.success ||
            result.error.code === 'Device_Disconnected' // This is an expected success
        ) {
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
            dispatch(forgetBluetoothDeviceThunk({ bluetoothId }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));
        }
    },
);

export const bluetoothEraseBondsThunk = createThunk(
    `${BLUETOOTH_PREFIX}/bluetoothEraseBondsThunk`,
    async (_, { dispatch, getState }) => {
        const isDeviceConnectedViaBluetooth = selectIsDeviceConnectedViaBluetooth(getState());
        const bluetoothId = selectDeviceBluetoothId(getState());

        if (isDeviceConnectedViaBluetooth && bluetoothId) {
            await dispatch(unpairCurrentBondThunk({ bluetoothId }));
        }
    },
);
