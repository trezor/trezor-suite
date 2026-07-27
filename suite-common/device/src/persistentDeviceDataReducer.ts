import { createReducer } from '@reduxjs/toolkit';

import type {
    PersistentDeviceData,
    StoredAuthenticateDeviceResult,
    TrezorDevice,
} from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';
import { getFirmwareVersionArray } from '@trezor/device-utils';

import { deviceActions } from './deviceActions';
import { persistentDeviceDataActions } from './persistentDeviceDataActions';

// An array of devices without a single primary id – a device can be matched by various criteria (various keys).
export type PersistentDeviceDataState = PersistentDeviceData[];

export const persistentDeviceDataInitialState: PersistentDeviceDataState = [];

const updatePersistentDeviceData = (
    state: PersistentDeviceDataState,
    device: Device | TrezorDevice,
) => {
    // do not persist data for unacquired/unreadable devices
    if (!device.features) return;
    // do not persist data for bootloader devices
    if (device.features.device_id === null) return;

    const updatedPersistentData = {
        device_id: device.features.device_id,
        fw_vendor: device.features.fw_vendor,
        revision: device.features.revision,
        label: device.features.label,
        initialized: device.features.initialized,
        thp: device.thp,
        descriptor: device.descriptor.apiType === 'bluetooth' ? device.descriptor : undefined,
        lastConnectedVia: device.descriptor.apiType === 'bluetooth' ? 'bluetooth' : 'usb',
        firmwareVersion: getFirmwareVersionArray(device),
    } as const;
    const initialPersistentData = {
        ...updatedPersistentData,
        // constant values, never expected to change in the lifetime of a device id
        internal_model: device.features.internal_model,
        unit_color: device.features.unit_color,
        // initial value, will be filled later
        delegatedIdentityKey: null,
    } as const;

    const index = state.findIndex(
        persistentDeviceData => persistentDeviceData.device_id === device.id,
    );
    const existingData = index >= 0 ? state[index] : undefined;
    if (existingData) {
        state[index] = {
            ...existingData,
            ...updatedPersistentData,
        };
    } else {
        state.push(initialPersistentData);
    }
};

const setDeviceAuthenticity = (
    state: PersistentDeviceDataState,
    deviceId: TrezorDevice['id'],
    result?: StoredAuthenticateDeviceResult,
) => {
    const data = state.find(persistentDeviceData => persistentDeviceData.device_id === deviceId);
    // expected to exist; device must have been connected or changed for this action to happen
    if (data === undefined) return;
    data.authenticityResult = result;
};

const setManualDeviceCheckSuccess = (
    state: PersistentDeviceDataState,
    deviceId: TrezorDevice['id'],
) => {
    const data = state.find(persistentDeviceData => persistentDeviceData.device_id === deviceId);
    // expected to exist; device must have been connected or changed for this action to happen
    if (data === undefined) return;
    data.manualCheckResult = { success: true };
};

/**
 * Reducer for persistentDeviceData, i.e. data that is pertinent only to device, not individual wallet.
 * Notably, this includes data that is kept even if all wallets of a device are ejected (mainly security checks data).
 * This is a child reducer to `deviceReducer` and SHALL NOT BE USED ON ITS OWN.
 * While the reducer itself is isolated on its substate, its selectors are hardwired to this hierarchy.
 */
export const persistentDeviceDataReducer = createReducer(
    persistentDeviceDataInitialState,
    builder => {
        builder
            .addCase(deviceActions.deviceChanged, (state, { payload }) => {
                updatePersistentDeviceData(state, payload);
            })
            .addCase(
                persistentDeviceDataActions.forgetDevicePersistentData,
                (state: PersistentDeviceDataState, { payload }) =>
                    state.filter(d => d.device_id !== payload.deviceId),
            )
            .addCase(
                persistentDeviceDataActions.clearDevicePersistentData,
                (_state: PersistentDeviceDataState) => [],
            )
            .addCase(
                persistentDeviceDataActions.setEntropyCheckResult,
                (
                    state: PersistentDeviceDataState,
                    { payload: { deviceId, ...entropyCheckResult } },
                ) => {
                    const data = state.find(
                        persistentDeviceData => persistentDeviceData.device_id === deviceId,
                    );

                    // expected to exist; device must have been connected or changed for this action to happen
                    if (data === undefined) return;
                    data.lastEntropyCheckResult = entropyCheckResult;
                },
            )
            .addCase(
                persistentDeviceDataActions.setDelegatedIdentityKey,
                (state: PersistentDeviceDataState, { payload: { deviceId, delegatedKey } }) => {
                    const data = state.find(
                        persistentDeviceData => persistentDeviceData.device_id === deviceId,
                    );

                    // expected to exist; device must have been connected or changed for this action to happen
                    if (data === undefined) return;
                    data.delegatedIdentityKey = delegatedKey;
                },
            )
            .addCase(
                persistentDeviceDataActions.setDeviceAuthenticityResult,
                (state: PersistentDeviceDataState, { payload }) => {
                    // nullish deviceId is impossible unless meta checks (id) are disabled. If it is nullish, it's a no-op.
                    setDeviceAuthenticity(state, payload.deviceId, payload.result);
                },
            )
            .addCase(
                persistentDeviceDataActions.setManualDeviceCheckSuccess,
                (state: PersistentDeviceDataState, { payload }) => {
                    setManualDeviceCheckSuccess(state, payload.deviceId);
                },
            )
            .addCase(
                deviceActions.connectDevice,
                (state: PersistentDeviceDataState, { payload: { device } }) => {
                    updatePersistentDeviceData(state, device);
                },
            );
    },
);
