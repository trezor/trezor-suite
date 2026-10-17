import type { TrezorDevice } from '@suite-common/suite-types';
import { getIsFactoryResetDevice } from '@suite-common/suite-utils';
import type { Device } from '@trezor/connect';
import { createWeakMapSelector } from '@trezor/redux-utils';

import {
    deviceInvariabilityCheck,
    rawDataToDeviceInvariabilityCheckDTO,
} from './deviceInvariabilityCheck';
import type { PersistentDeviceDataRootState } from './persistentDeviceDataReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<PersistentDeviceDataRootState>();

export const selectPersistentDeviceData = (state: PersistentDeviceDataRootState) =>
    state.persistentDeviceData.devices;

export const selectPersistentDeviceDataById = createMemoizedSelector(
    [selectPersistentDeviceData, (_state, deviceId: TrezorDevice['id']) => deviceId],
    (persistentDeviceData, deviceId) =>
        persistentDeviceData.find(data => data.device_id === deviceId),
);

export const selectEntropyCheckResultByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.lastEntropyCheckResult,
);

/**
 * Selects if a device is eligible for Manual Device Check:
 * - either a fresh or factory-reset device in bootloader (has no deviceId).
 * - or any device that hasn't been successfully confirmed before and has an Id (so its confirmation can be persisted).
 */
export const selectDeviceNeedsManualCheck = createMemoizedSelector(
    [
        (_state, device?: TrezorDevice) => device,
        (state, device?: TrezorDevice) => selectPersistentDeviceDataById(state, device?.id),
    ],
    (device, persistentDeviceData): boolean => {
        // User wouldn't be able to visually check model and color if the device is not connected.
        if (device?.connected !== true) return false;

        if (getIsFactoryResetDevice(device)) return true;

        return (
            // deviceId condition just to make it explicit, but if falsy, then persistentDeviceData won't match.
            typeof device?.id === 'string' &&
            persistentDeviceData?.manualCheckResult?.success !== true
        );
    },
);

export const selectDeviceAuthenticityByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.authenticityResult,
);

// Result of the wallet creation entropy check.
export const selectIsEntropyCheckFailed = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.lastEntropyCheckResult?.success === false,
);

export const selectIsDiscoveryEntropyCheckFailed = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData =>
        (persistentDeviceData?.lastEntropyCheckResult?.discoveryCheckFailedPaths?.length ?? 0) > 0,
);

export const selectIsDeviceInvariabilityCheckSuccess = createMemoizedSelector(
    [
        (_state, device?: Device) => device,
        (state, device?: Device) => selectPersistentDeviceDataById(state, device?.id),
    ],
    (device, previousData) => {
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData });

        return deviceInvariabilityCheck(dto).success;
    },
);

export const selectDelegatedIdentityKeyByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.delegatedIdentityKey ?? null,
);

/**
 * For a given deviceId, find its model if it was verified by Device Authenticity Check (DAC).
 * Return `null` if the model isn't verified (no record of a successful DAC for this deviceId).
 *
 * While `device.internal_model` is only reported by the device, during the DAC flow it is cross-checked with the model
 * on each authenticity proof. The `deviceInvariabilityCheck` then makes sure that the model never changes.
 */
export const selectVerifiedModelByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => {
        if (!persistentDeviceData) return null;
        const { authenticityResult } = persistentDeviceData;
        if (authenticityResult?.valid !== true) return null;

        return persistentDeviceData.internal_model;
    },
);
