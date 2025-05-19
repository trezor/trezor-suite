import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { Dispatch } from '../../types/suite';

type UnpairCurrentBondParams = {
    bluetoothId: string;
    device: TrezorDevice;
    dispatch: Dispatch;
};

const unpairCurrentBond = async ({ bluetoothId, device, dispatch }: UnpairCurrentBondParams) => {
    const result = await TrezorConnect.bleUnpair({ device, all: false });
    if (
        result.success ||
        result.payload.code === 'Device_Disconnected' // This is an expected success
    ) {
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));

        const resultForget = await bluetoothIpc.forgetDevice(bluetoothId);
        if (!resultForget.success) {
            dispatch(
                bluetoothActions.setBluetoothDeviceNeedsManualOsRemoval({
                    needsManualRemoval: true,
                }),
            );
        }
    } else {
        dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
    }
};

type BluetoothEraseBondsThunkParams = {
    device: TrezorDevice;
};

export const bluetoothEraseBondsThunk = createThunk<void, BluetoothEraseBondsThunkParams, void>(
    `${BLUETOOTH_PREFIX}/bluetoothEraseBondsThunk`,
    async ({ device }, { dispatch }) => {
        if (!device.features?.capabilities.includes('Capability_BLE')) {
            return;
        }

        const bluetoothId = device.bluetoothProps?.id;

        if (bluetoothId !== undefined) {
            await unpairCurrentBond({ bluetoothId, device, dispatch });
        }
    },
);
