import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type UnpairCurrentBondParams = {
    bluetoothId: string;
};

export const forgetBluetoothDevice = createThunk(
    `${BLUETOOTH_PREFIX}/forgetBluetoothDevice`,
    async (_, { getState, dispatch }) => {
        const device = selectSelectedDevice(getState());

        if (!device || !device.bluetoothProps) return;

        const resultForget = await bluetoothIpc.forgetDevice(device.bluetoothProps.id);
        if (!resultForget.success) {
            dispatch(
                bluetoothActions.setBluetoothDeviceNeedsManualOsRemoval({
                    needsManualRemoval: true,
                }),
            );
        }
    },
);

const unpairCurrentBond = createThunk<void, UnpairCurrentBondParams, void>(
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
            dispatch(forgetBluetoothDevice());
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
            await dispatch(unpairCurrentBond({ bluetoothId }));
        }
    },
);
