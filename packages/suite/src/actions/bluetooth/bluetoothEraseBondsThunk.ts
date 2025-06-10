import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    setBluetoothDeviceNeedsManualOsRemoval,
    setIsUnpairingDevice,
} from './desktopBluetoothReducer';

type ForgetBluetoothDeviceThunkParams = {
    // This thunk must relay on `bluetoothId` directly. When this think is called,
    // the device may already be disconnected, and therefore, it cannot be selected from the state.
    bluetoothId: string;
};

export const forgetBluetoothDeviceThunk = createThunk<void, ForgetBluetoothDeviceThunkParams, void>(
    `${BLUETOOTH_PREFIX}/forgetBluetoothDevice`,
    async ({ bluetoothId }, { dispatch }) => {
        dispatch(setIsUnpairingDevice({ isUnpairing: true }));
        const resultForget = await bluetoothIpc.forgetDevice(bluetoothId);
        dispatch(setIsUnpairingDevice({ isUnpairing: false }));
        if (!resultForget.success) {
            dispatch(setBluetoothDeviceNeedsManualOsRemoval({ needsManualRemoval: true }));
        }
    },
);

type UnpairCurrentBondThunkParams = {
    bluetoothId: string;
};

const unpairCurrentBondThunk = createThunk<void, UnpairCurrentBondThunkParams, void>(
    `${BLUETOOTH_PREFIX}/unpairCurrentBond`,
    async ({ bluetoothId }, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());

        if (!device) return;

        const result = await TrezorConnect.bleUnpair({ device, all: false });
        if (
            result.success ||
            result.payload.code === 'Device_Disconnected' // This is an expected success
        ) {
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
            dispatch(forgetBluetoothDeviceThunk({ bluetoothId }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }
    },
);

export const bluetoothEraseBondsThunk = createThunk(
    `${BLUETOOTH_PREFIX}/bluetoothEraseBondsThunk`,
    async (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());
        if (!device || !device.features?.capabilities.includes('Capability_BLE')) {
            return;
        }

        const bluetoothId = device.bluetoothProps?.id;

        if (bluetoothId !== undefined) {
            await dispatch(unpairCurrentBondThunk({ bluetoothId }));
        }
    },
);
