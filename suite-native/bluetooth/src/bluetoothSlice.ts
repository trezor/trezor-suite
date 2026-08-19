import { type PayloadAction } from '@reduxjs/toolkit';

import {
    type BluetoothReducerDeps,
    type BluetoothState,
    prepareBluetoothReducerCreator,
    prepareInitialState,
} from '@suite-common/bluetooth';
import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { UI_EVENTS, type UiEventFirmwareDisconnect } from '@trezor/connect';
import { bluetoothManager } from '@trezor/transport-native-bluetooth';

import { type BluetoothDevice, type BluetoothPermissionStatus } from './types';

export type NativeBluetoothState = BluetoothState<BluetoothDevice> & {
    permissionStatus: BluetoothPermissionStatus;
};

export type NativeBluetoothRootState = {
    bluetooth: NativeBluetoothState;
};

export const bluetoothInitialState: NativeBluetoothState = {
    ...prepareInitialState<BluetoothDevice>(),
    permissionStatus: 'unavailable',
};

const bluetoothSlice = createSliceWithExtraDeps({
    name: 'bluetooth',
    initialState: bluetoothInitialState,
    reducers: {
        updatePermissionStatus: (state, { payload }: PayloadAction<BluetoothPermissionStatus>) => {
            // do not allow already stored 'blocked' to be overwritten with 'denied' on Android
            // https://github.com/zoontek/react-native-permissions/blob/3.6.0/README.md#android-flow
            if (state.permissionStatus !== 'blocked' || payload !== 'denied') {
                state.permissionStatus = payload;
            }
        },
    },
    extraReducers: (builder, extra: BluetoothReducerDeps) => {
        const commonReducer = prepareBluetoothReducerCreator<BluetoothDevice>()(extra);
        builder
            .addCase(UI_EVENTS.FIRMWARE_DISCONNECT, (_, action: UiEventFirmwareDisconnect) => {
                const { descriptor } = action.payload.device;
                const deviceId = descriptor.apiType === 'bluetooth' ? descriptor.id : undefined;
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
export const prepareBluetoothReducer = bluetoothSlice.prepareReducer;
