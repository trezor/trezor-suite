import { AnyAction, Draft } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { DeviceConnectActionPayload, deviceActions } from '@suite-common/wallet-core';

import { bluetoothActions } from './bluetoothActions';
import { deserializeBluetoothDeviceSerialization } from './deserializeBluetoothDeviceSerialization';
import { BluetoothAdapterStatus, BluetoothDeviceCommon, BluetoothScanStatus } from './types';

export type BluetoothState<T extends BluetoothDeviceCommon> = {
    isBluetoothListOpen: boolean;
    adapterStatus: BluetoothAdapterStatus;
    scanStatus: BluetoothScanStatus;
    nearbyDevices: null | T[]; // Must be sorted, the newest last. Null = we haven't received first update yet

    // This will be persisted. Those are devices we believed that are paired
    // (because we already successfully paired them in the Suite) in the Operating System
    knownDevices: T[];

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

export const prepareBluetoothReducerCreator = <T extends BluetoothDeviceCommon>() => {
    const initialState: BluetoothState<T> = {
        isBluetoothListOpen: false,
        adapterStatus: 'unknown',
        scanStatus: 'idle',
        nearbyDevices: null,
        knownDevices: [] as T[],
        unpairedDeviceNeedsManualOsRemoval: false,
        connectingDeviceIds: [],
    };

    return createReducerWithExtraDeps<BluetoothState<T>>(initialState, (builder, extra) =>
        builder
            .addCase(bluetoothActions.adapterEventAction, (state, { payload: { status } }) => {
                state.adapterStatus = status;
                if (status !== 'enabled') {
                    state.nearbyDevices = [];
                    state.scanStatus = 'idle';
                }
            })
            .addCase(
                bluetoothActions.nearbyDevicesUpdateAction,
                (state, { payload: { nearbyDevices } }) => {
                    state.nearbyDevices = nearbyDevices
                        // Devices with 'pairing-error' status should NOT be displayed in the list, as it
                        // won't be possible to connect to them ever again. User has to start pairing again,
                        // which would produce a device with new id.
                        .filter(
                            nearbyDevice => nearbyDevice.connectionStatus?.type !== 'pairing-error',
                        ) as Draft<T>[];
                },
            )
            .addCase(
                bluetoothActions.updateDeviceConnectionStatus,
                (state, { payload: { deviceId, connectionStatus } }) => {
                    if (state.nearbyDevices !== null) {
                        state.nearbyDevices = state.nearbyDevices.map(it =>
                            it.id === deviceId ? { ...it, connectionStatus } : it,
                        ) as Draft<T>[];
                    }

                    state.knownDevices = state.knownDevices.map(it =>
                        it.id === deviceId ? { ...it, connectionStatus } : it,
                    ) as Draft<T>[];
                },
            )
            .addCase(bluetoothActions.deviceUpdateAction, (state, { payload: { device } }) => {
                if (state.nearbyDevices !== null) {
                    state.nearbyDevices = state.nearbyDevices.map(it =>
                        it.id === device.id ? device : it,
                    ) as Draft<T>[];
                }

                state.knownDevices = state.knownDevices.map(it =>
                    it.id === device.id ? device : it,
                ) as Draft<T>[];
            })
            .addCase(
                bluetoothActions.knownDevicesUpdateAction,
                (state, { payload: { knownDevices } }) => {
                    state.knownDevices = knownDevices as Draft<T>[];
                },
            )
            .addCase(bluetoothActions.removeKnownDeviceAction, (state, { payload: { id } }) => {
                state.knownDevices = state.knownDevices.filter(
                    knownDevice => knownDevice.id !== id,
                );
            })
            .addCase(bluetoothActions.scanStatusAction, (state, { payload: { status } }) => {
                state.scanStatus = status;
            })
            .addCase(deviceActions.deviceDisconnect, (state, { payload: { bluetoothProps } }) => {
                if (bluetoothProps !== undefined) {
                    if (state.nearbyDevices !== null) {
                        state.nearbyDevices = state.nearbyDevices.filter(
                            it => it.id !== bluetoothProps.id,
                        );
                    }
                }
            })
            .addCase(
                bluetoothActions.setBluetoothDeviceNeedsManualOsRemoval,
                (state, { payload: { needsManualRemoval } }) => {
                    state.unpairedDeviceNeedsManualOsRemoval = needsManualRemoval;
                },
            )
            .addCase(
                bluetoothActions.startConnectingBluetoothDevice,
                (state, { payload: { deviceId } }) => {
                    state.connectingDeviceIds.push(deviceId);
                },
            )
            .addCase(
                bluetoothActions.stopConnectingBluetoothDevice,
                (state, { payload: { deviceId } }) => {
                    state.connectingDeviceIds = state.connectingDeviceIds.filter(
                        id => id !== deviceId,
                    );
                },
            )
            .addCase(bluetoothActions.setBluetoothListOpen, (state, { payload: { isOpen } }) => {
                state.isBluetoothListOpen = isOpen;
            })

            .addCase(
                bluetoothActions.setBluetoothDeviceNeedsManualOsRemoval,
                (state, { payload: { needsManualRemoval } }) => {
                    state.unpairedDeviceNeedsManualOsRemoval = needsManualRemoval;
                },
            )
            .addMatcher(
                action =>
                    action.type === deviceActions.connectDevice.type ||
                    action.type === deviceActions.connectUnacquiredDevice.type,
                (
                    state,
                    {
                        payload: {
                            device: { bluetoothProps },
                        },
                    }: { payload: DeviceConnectActionPayload },
                ) => {
                    if (bluetoothProps === undefined) {
                        return;
                    }

                    const device = state.nearbyDevices?.find(it => it.id === bluetoothProps.id);

                    if (device !== undefined) {
                        // Once the device is fully connected, we save it to the list of known devices,
                        // so next time user opens suite, we can automatically connect to it.
                        const foundKnownDevice = state.knownDevices.find(
                            it => it.id === bluetoothProps.id,
                        );
                        if (foundKnownDevice === undefined) {
                            state.knownDevices.push(device);
                        }
                    }
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => {
                    const loadedKnownDevices = (action.payload?.bluetooth?.knownDevices ??
                        []) as T[];

                    state.knownDevices = loadedKnownDevices.map(
                        deserializeBluetoothDeviceSerialization,
                    ) as Draft<T>[];
                },
            ),
    );
};
