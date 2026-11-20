import { deviceActions } from '@suite-common/device';
import type {
    PersistentDeviceData,
    StoredAuthenticateDeviceResult,
    TrezorDevice,
} from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';
import { getFirmwareVersionArray } from '@trezor/device-utils';
import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@trezor/redux-utils';

import { persistentDeviceDataActions } from './persistentDeviceDataActions';

export type PersistentDeviceDataState = {
    // An array of devices without a single primary id – a device can be matched by various criteria (various keys).
    devices: PersistentDeviceData[];
};

export type PersistentDeviceDataRootState = {
    persistentDeviceData: PersistentDeviceDataState;
};

export const persistentDeviceDataInitialState: PersistentDeviceDataState = { devices: [] };

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

    const index = state.devices.findIndex(
        persistentDeviceData => persistentDeviceData.device_id === device.id,
    );
    const existingData = index >= 0 ? state.devices[index] : undefined;
    if (existingData) {
        state.devices[index] = {
            ...existingData,
            ...updatedPersistentData,
        };
    } else {
        state.devices.push(initialPersistentData);
    }
};

const setDeviceAuthenticity = (
    state: PersistentDeviceDataState,
    deviceId: TrezorDevice['id'],
    result?: StoredAuthenticateDeviceResult,
) => {
    const data = state.devices.find(
        persistentDeviceData => persistentDeviceData.device_id === deviceId,
    );
    // expected to exist; device must have been connected or changed for this action to happen
    if (data === undefined) return;
    data.authenticityResult = result;
};

const setManualDeviceCheckSuccess = (
    state: PersistentDeviceDataState,
    deviceId: TrezorDevice['id'],
) => {
    const data = state.devices.find(
        persistentDeviceData => persistentDeviceData.device_id === deviceId,
    );
    // expected to exist; device must have been connected or changed for this action to happen
    if (data === undefined) return;
    data.manualCheckResult = { success: true };
};

export type PersistentDeviceDataReducerDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadPersistentDeviceData'>;

/**
 * Reducer for persistentDeviceData, i.e. data that is pertinent only to device, not individual wallet.
 * Notably, this includes data that is kept even if all wallets of a device are ejected (mainly security checks data).
 * Not to be confused with `devices` on deviceReducer`. That entity is merged DEVICE+WALLET data.
 * In future, if we separate wallet & device data in deviceReducer, this shall be renamed to device.
 */
export const preparePersistentDeviceDataReducer = createReducerWithExtraDeps<
    PersistentDeviceDataState,
    PersistentDeviceDataReducerDeps
>(persistentDeviceDataInitialState, (builder, extra) => {
    builder
        .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadPersistentDeviceData)
        .addCase(deviceActions.deviceChanged, (state, { payload }) => {
            updatePersistentDeviceData(state, payload);
        })
        .addCase(
            persistentDeviceDataActions.forgetDevicePersistentData,
            (state: PersistentDeviceDataState, { payload }) => {
                state.devices = state.devices.filter(d => d.device_id !== payload.deviceId);
            },
        )
        .addCase(
            persistentDeviceDataActions.clearDevicePersistentData,
            (state: PersistentDeviceDataState) => {
                state.devices = [];
            },
        )
        .addCase(
            persistentDeviceDataActions.setEntropyCheckResult,
            (
                state: PersistentDeviceDataState,
                { payload: { deviceId, ...entropyCheckResult } },
            ) => {
                const data = state.devices.find(
                    persistentDeviceData => persistentDeviceData.device_id === deviceId,
                );

                // TODO this is a bit unpredictable, should be replaced by upsert logic at all levels of depth → create object if doesn't exist. Should be a pure fn outside of reducer.
                // expected to exist; device must have been connected or changed for this action to happen
                if (data === undefined) return;

                // Keep the xpubHashes if the new result has none. This is just in case – if resetDevice fails after emitting entropy check success, it's not a Failure_EntropyCheck error.
                // Hashes not belonging to the current seed are dropped by clearEntropyCheckXPubHashes.
                const xpubHashes =
                    entropyCheckResult.xpubHashes ?? data.lastEntropyCheckResult?.xpubHashes;
                data.lastEntropyCheckResult =
                    xpubHashes === undefined
                        ? entropyCheckResult
                        : { ...entropyCheckResult, xpubHashes };
            },
        )
        .addCase(
            persistentDeviceDataActions.clearEntropyCheckXPubHashes,
            (state: PersistentDeviceDataState, { payload: { deviceId } }) => {
                const entropyCheckResult = state.devices.find(
                    persistentDeviceData => persistentDeviceData.device_id === deviceId,
                )?.lastEntropyCheckResult;
                if (entropyCheckResult === undefined) return;

                // The result itself is kept: a failed wallet creation check is about the device, not the seed.
                delete entropyCheckResult.xpubHashes;
                delete entropyCheckResult.discoveryCheckFailedPaths;
            },
        )
        .addCase(
            persistentDeviceDataActions.setDiscoveryEntropyCheckResult,
            (state: PersistentDeviceDataState, { payload: { deviceId, success, path } }) => {
                const entropyCheckResult = state.devices.find(
                    persistentDeviceData => persistentDeviceData.device_id === deviceId,
                )?.lastEntropyCheckResult;

                // Discovery entropy check is performed only against a stored wallet creation result.
                if (entropyCheckResult === undefined) return;

                const otherFailedPaths = (
                    entropyCheckResult.discoveryCheckFailedPaths ?? []
                ).filter(failedPath => failedPath !== path);

                // Clear paths that succeeded in this discovery.
                if (success) {
                    entropyCheckResult.discoveryCheckFailedPaths = otherFailedPaths;

                    return;
                }
                // If the path failed, add it, or keep deduplicated.
                entropyCheckResult.discoveryCheckFailedPaths = [...otherFailedPaths, path];
            },
        )
        .addCase(
            persistentDeviceDataActions.setDelegatedIdentityKey,
            (state: PersistentDeviceDataState, { payload: { deviceId, delegatedKey } }) => {
                const data = state.devices.find(
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
        .addCase(deviceActions.connectDevice, (state: PersistentDeviceDataState, { payload }) => {
            updatePersistentDeviceData(state, payload.device);
        });
});
