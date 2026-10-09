import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { TrezorDevice } from '@suite-common/suite-types';
import { getIsFactoryResetDevice } from '@suite-common/suite-utils';
import type { Device } from '@trezor/connect';

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
    (device, persistentDeviceData): boolean =>
        getIsFactoryResetDevice(device) ||
        // deviceId condition just to make it explicit, but if falsy, then persistentDeviceData won't match.
        (typeof device?.id === 'string' &&
            persistentDeviceData?.manualCheckResult?.success !== true),
);

export const selectDeviceAuthenticityByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.authenticityResult,
);

export const selectIsEntropyCheckFailed = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.lastEntropyCheckResult?.success === false,
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
