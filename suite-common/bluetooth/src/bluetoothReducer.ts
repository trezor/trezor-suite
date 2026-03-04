import { AnyAction, Draft } from '@reduxjs/toolkit';

import { DeviceConnectActionPayload, deviceActions } from '@suite-common/device';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { BluetoothDeviceId, TrezorPushNotificationType } from '@trezor/connect';

import { bluetoothActions } from './bluetoothActions';
import { deserializeBluetoothDeviceSerialization } from './deserializeBluetoothDeviceSerialization';
import { filterOutOldDuplicates } from './filterOutOldDuplicates';
import {
    BluetoothAdapterStatus,
    BluetoothAutoConnectPolicy,
    BluetoothDeviceCommon,
    BluetoothScanStatus,
} from './types';

export type BluetoothState<T extends BluetoothDeviceCommon> = {
    adapterStatus: BluetoothAdapterStatus;
    scanStatus: BluetoothScanStatus;
    nearbyDevices: null | T[]; // Must be sorted, the newest last. Null = we haven't received first update yet

    // This will be persisted. Those are devices we believed that are paired
    // (because we already successfully paired them in the Suite) in the Operating System
    knownDevices: T[];
    ignoredDeviceIds: string[];
    autoConnectPolicy: Record<BluetoothDeviceId, BluetoothAutoConnectPolicy | undefined>;
    isDeviceOsUnpairingRequired: boolean;
};

export const prepareInitialState = <T extends BluetoothDeviceCommon>(): BluetoothState<T> => ({
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: null,
    knownDevices: [] as T[],
    ignoredDeviceIds: [],
    autoConnectPolicy: {},
    isDeviceOsUnpairingRequired: false,
});

export const prepareBluetoothReducerCreator = <T extends BluetoothDeviceCommon>() =>
    createReducerWithExtraDeps<BluetoothState<T>>(prepareInitialState<T>(), (builder, extra) =>
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
                    state.nearbyDevices = filterOutOldDuplicates(
                        nearbyDevices
                            // Devices with 'pairing-error' status should NOT be displayed in the list, as it
                            // won't be possible to connect to them ever again. User has to start pairing again,
                            // which would produce a device with new id.
                            .filter(
                                nearbyDevice =>
                                    nearbyDevice.connectionStatus?.type !== 'pairing-error' &&
                                    !state.ignoredDeviceIds.includes(nearbyDevice.id),
                            ) as Draft<T>[],
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

                // pairing error can be received from NAPI connectDevice
                // in that case the rust server doesnt know about it
                if (device.connectionStatus.type === 'pairing-error') {
                    state.ignoredDeviceIds.push(device.id);
                }

                state.knownDevices = state.knownDevices.map(it =>
                    it.id === device.id ? { deviceId: it.deviceId, ...device } : it,
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
            .addCase(deviceActions.deviceDisconnect, (state, { payload: { descriptor } }) => {
                if (descriptor.apiType === 'bluetooth' && descriptor.id !== undefined) {
                    if (state.nearbyDevices !== null) {
                        state.nearbyDevices = state.nearbyDevices.filter(
                            it => it.id !== descriptor.id,
                        );
                    }
                }
            })
            .addCase(bluetoothActions.enableAutoConnect, (state, { payload }) => {
                if (payload) {
                    delete state.autoConnectPolicy[payload.deviceId];
                } else {
                    state.autoConnectPolicy = {};
                }
            })
            .addCase(bluetoothActions.setIsDeviceOsUnpairingRequired, (state, { payload }) => {
                state.isDeviceOsUnpairingRequired = payload;
            })

            .addMatcher(
                action =>
                    action.type === deviceActions.connectDevice.type ||
                    action.type === deviceActions.connectUnacquiredDevice.type,
                (
                    state,
                    {
                        payload: {
                            device: { descriptor, id: deviceId },
                        },
                    }: { payload: DeviceConnectActionPayload },
                ) => {
                    if (descriptor.apiType !== 'bluetooth' || !descriptor.id) {
                        return;
                    }

                    const device = state.nearbyDevices?.find(it => it.id === descriptor.id);

                    if (device !== undefined) {
                        // Once the device is fully connected, we save it to the list of known devices,
                        // so next time user opens suite, we can automatically connect to it.
                        const foundKnownDevice = state.knownDevices.find(
                            it => it.id === descriptor.id,
                        );
                        if (foundKnownDevice === undefined) {
                            state.knownDevices.push({ ...device, deviceId });
                        } else {
                            delete state.autoConnectPolicy[descriptor.id as BluetoothDeviceId];
                            // update deviceId in case it was missing
                            if (deviceId && foundKnownDevice.deviceId !== deviceId) {
                                foundKnownDevice.deviceId = deviceId;
                            }
                        }
                    }
                },
            )
            .addMatcher(
                action => action.type === deviceActions.deviceDisconnect.type,
                (state, { payload }: ReturnType<typeof deviceActions.deviceDisconnect>) => {
                    const id =
                        payload.descriptor.apiType === 'bluetooth' && payload.descriptor.id
                            ? (payload.descriptor.id as BluetoothDeviceId)
                            : undefined;
                    const affectedDevice = id && state.knownDevices.find(it => it.id === id);
                    if (
                        affectedDevice &&
                        state.autoConnectPolicy[id]?.type !== 'autoconnect-disabled'
                    ) {
                        state.autoConnectPolicy[id] = {
                            type: 'recently-disconnected',
                            timestamp: Date.now(),
                        };
                    }
                },
            )
            .addMatcher(
                action => action.type === deviceActions.devicePushNotification.type,
                (
                    state,
                    {
                        payload: { device, type },
                    }: ReturnType<typeof deviceActions.devicePushNotification>,
                ) => {
                    if (type === TrezorPushNotificationType.DISCONNECT) {
                        const id =
                            device.descriptor.apiType === 'bluetooth' && device.descriptor.id
                                ? (device.descriptor.id as BluetoothDeviceId)
                                : undefined;
                        const affectedDevice = id && state.knownDevices.find(it => it.id === id);
                        if (affectedDevice) {
                            state.autoConnectPolicy[id] = {
                                type: 'autoconnect-disabled',
                            };
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
