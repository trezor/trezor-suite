import {
    BluetoothState,
    prepareBluetoothReducerCreator,
    prepareInitialState,
} from '@suite-common/bluetooth';
import { AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions } from '@suite-common/wallet-core';

import { DesktopBluetoothDevice } from './DesktopBluetoothDevice';

export type DesktopBluetoothState = BluetoothState<DesktopBluetoothDevice> & {
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

    // When the device is being unpaired (manual Erase Bonds or Wipe Device),
    // it may take some time. During that time, the Device is already disconnected,
    // but the user needs to be notified that something is happening.
    isUnpairingDevice: boolean;
};

export type WithBluetoothRootState = {
    bluetooth: DesktopBluetoothState;
};

export const bluetoothSlice = createSliceWithExtraDeps({
    name: 'bluetooth',
    initialState: {
        ...prepareInitialState<DesktopBluetoothDevice>(),
        unpairedDeviceNeedsManualOsRemoval: false,
        connectingDeviceIds: [] as string[],
        isUnpairingDevice: false,
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
        setIsUnpairingDevice: (state, { payload: { isUnpairing } }) => {
            state.isUnpairingDevice = isUnpairing;
        },
    },
    extraReducers: (builder, extra) => {
        const commonReducer = prepareBluetoothReducerCreator<DesktopBluetoothDevice>()(extra);

        builder
            .addCase(deviceActions.deviceDisconnect, (state, action) => {
                commonReducer(state, action as AnyAction);

                state.knownDevices = state.knownDevices.map(device => {
                    if (device.deviceId === action.payload.id) {
                        device.connected = false;
                        device.connectionStatus = {
                            type: 'disconnected',
                        };
                    }

                    return device;
                });
            })
            .addDefaultCase((state, action) => {
                commonReducer(state, action as AnyAction);
            });
    },
});

export const {
    setBluetoothDeviceNeedsManualOsRemoval,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
    setIsUnpairingDevice,
} = bluetoothSlice.actions;
