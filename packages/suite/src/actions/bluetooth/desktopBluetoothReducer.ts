import {
    type BluetoothState,
    prepareBluetoothReducerCreator,
    prepareInitialState,
} from '@suite-common/bluetooth';
import { deviceActions } from '@suite-common/device';
import { type AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';

export type DesktopBluetoothState = BluetoothState<DesktopBluetoothDevice> & {
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

    // Flag to display Modal to instruct the user to open bluetooth settings and pair manually
    isManualPairingRequired: boolean;
};

export const initialDesktopBluetoothState: DesktopBluetoothState = {
    ...prepareInitialState<DesktopBluetoothDevice>(),
    connectingDeviceIds: [],
    isUnpairingDevice: false,
    isManualPairingRequired: false,
};

export type WithBluetoothRootState = {
    bluetooth: DesktopBluetoothState;
};

export const bluetoothSlice = createSliceWithExtraDeps({
    name: 'bluetooth',
    initialState: initialDesktopBluetoothState,
    reducers: {
        startConnectingBluetoothDevice: (state, { payload: { deviceId } }) => {
            state.connectingDeviceIds.push(deviceId);
        },
        stopConnectingBluetoothDevice: (state, { payload: { deviceId } }) => {
            state.connectingDeviceIds = state.connectingDeviceIds.filter(id => id !== deviceId);
        },
        setIsUnpairingDevice: (state, { payload: { isUnpairing } }) => {
            state.isUnpairingDevice = isUnpairing;
        },
        setBluetoothDeviceNeedsManualPairing: (state, { payload }) => {
            state.isManualPairingRequired = payload;
        },
    },
    extraReducers: (builder, extra) => {
        const commonReducer = prepareBluetoothReducerCreator<DesktopBluetoothDevice>()(extra);

        builder
            .addCase(deviceActions.deviceDisconnect, (state, action) => {
                commonReducer(state, action as AnyAction);

                state.knownDevices = state.knownDevices.map(device => {
                    if (device.deviceId === action.payload.id) {
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
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
    setIsUnpairingDevice,
    setBluetoothDeviceNeedsManualPairing,
} = bluetoothSlice.actions;
