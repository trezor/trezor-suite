import { PayloadAction } from '@reduxjs/toolkit';

import {
    BluetoothState,
    prepareBluetoothReducerCreator,
    prepareInitialState,
} from '@suite-common/bluetooth';
import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { FirmwareDisconnect, UI_REQUEST } from '@trezor/connect';
import { bluetoothManager } from '@trezor/transport-native-bluetooth';

import { BluetoothDevice, BluetoothPermissionStatus } from './types';

type NativeBluetoothState = BluetoothState<BluetoothDevice> & {
    permissionStatus: BluetoothPermissionStatus;
};

export type NativeBluetoothRootState = {
    bluetooth: NativeBluetoothState;
};

export const bluetoothSlice = createSliceWithExtraDeps({
    name: 'bluetooth',
    initialState: {
        ...prepareInitialState<BluetoothDevice>(),
        permissionStatus: 'unavailable',
    },
    reducers: {
        updatePermissionStatus: (state, { payload }: PayloadAction<BluetoothPermissionStatus>) => {
            // do not allow already stored 'blocked' to be overwritten with 'denied' on Android
            // https://github.com/zoontek/react-native-permissions/blob/3.6.0/README.md#android-flow
            if (state.permissionStatus !== 'blocked' || payload !== 'denied') {
                state.permissionStatus = payload;
            }
        },
    },
    extraReducers: (builder, extra) => {
        const commonReducer = prepareBluetoothReducerCreator<BluetoothDevice>()(extra);
        builder
            .addCase(UI_REQUEST.FIRMWARE_DISCONNECT, (_, action: FirmwareDisconnect) => {
                const deviceId = action.payload.device.bluetoothProps?.id;
                if (deviceId) {
                    bluetoothManager.disconnectDevice({ deviceId });
                }
            })
            .addDefaultCase((state, action) => {
                commonReducer(state, action);
            });
    },
});

export const { updatePermissionStatus } = bluetoothSlice.actions;
