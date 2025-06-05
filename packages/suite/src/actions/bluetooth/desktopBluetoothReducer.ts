import {
    BluetoothState,
    prepareBluetoothReducerCreator,
    prepareInitialState,
} from '@suite-common/bluetooth';
import { AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';

import { DesktopBluetoothDevice } from './DesktopBluetoothDevice';

export type DesktopBluetoothState = BluetoothState<DesktopBluetoothDevice> & {
    isBluetoothListOpen: boolean;
    // Flag to display some extra info (Modal) to instruct the user to remove
    // the device from the OS settings manually
    unpairedDeviceNeedsManualOsRemoval: boolean;

    // When we get an update that KnownDevice appeared, we start auto-connecting to it.
    // But there may be other updates before the connection is done, and we want to skip them
    // during the connection process.
    //
    // This indicates that suite initiated connection to the device. In contrast with:
    // { type: 'connecting' } in the DeviceBluetoothConnectionStatus which indicates
    // the state of the Bluetooth connection itself.
    connectingDeviceIds: string[];
};

export type WithBluetoothRootState = {
    bluetooth: DesktopBluetoothState;
};

export const bluetoothSlice = createSliceWithExtraDeps({
    name: 'bluetooth',
    initialState: {
        ...prepareInitialState<DesktopBluetoothDevice>(),
        isBluetoothListOpen: false,
        unpairedDeviceNeedsManualOsRemoval: false,
        connectingDeviceIds: [] as string[],
    } satisfies DesktopBluetoothState,
    reducers: {
        setBluetoothDeviceNeedsManualOsRemoval: (state, { payload: { needsManualRemoval } }) => {
            state.unpairedDeviceNeedsManualOsRemoval = needsManualRemoval;
        },
        startConnectingBluetoothDevice: (state, { payload: { deviceId } }) => {
            state.connectingDeviceIds.push(deviceId);
        },
        stopConnectingBluetoothDevice: (state, { payload: { deviceId } }) => {
            state.connectingDeviceIds = state.connectingDeviceIds.filter(id => id !== deviceId);
        },
        setBluetoothListOpen: (state, { payload: { isOpen } }) => {
            state.isBluetoothListOpen = isOpen;
        },
    },
    extraReducers: (builder, extra) => {
        const commonReducer = prepareBluetoothReducerCreator<DesktopBluetoothDevice>()(extra);

        builder.addDefaultCase((state, action) => {
            commonReducer(state, action as AnyAction);
        });
    },
});

export const {
    setBluetoothDeviceNeedsManualOsRemoval,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
    setBluetoothListOpen,
} = bluetoothSlice.actions;
