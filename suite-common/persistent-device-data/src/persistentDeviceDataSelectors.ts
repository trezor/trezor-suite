import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { TrezorDevice } from '@suite-common/suite-types';

import {
    deviceInvariabilityCheck,
    rawDataToDeviceInvariabilityCheckDTO,
} from './deviceInvariabilityCheck';
import type { PersistentDeviceDataRootState } from './persistentDeviceDataReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<PersistentDeviceDataRootState>();

export const selectPersistentDeviceData = (state: PersistentDeviceDataRootState) =>
    state.persistentDeviceData;

export const selectPersistentDeviceDataById = createMemoizedSelector(
    [selectPersistentDeviceData, (_state, deviceId: TrezorDevice['id']) => deviceId],
    (persistentDeviceData, deviceId) =>
        persistentDeviceData.find(data => data.device_id === deviceId),
);

export const selectEntropyCheckResultByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.lastEntropyCheckResult,
);

export const selectDeviceAuthenticityByDeviceId = createMemoizedSelector(
    [
        (_state: PersistentDeviceDataRootState, deviceId: TrezorDevice['id']) => deviceId,
        selectPersistentDeviceData,
    ],
    (deviceId, persistentDeviceData) =>
        deviceId
            ? persistentDeviceData.find(data => data.device_id === deviceId)?.authenticityResult
            : undefined,
);

export const selectIsEntropyCheckFailed = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.lastEntropyCheckResult?.success === false,
);

export const selectIsDeviceInvariabilityCheckSuccess = createMemoizedSelector(
    [
        (_state, device) => device,
        (state, device) => selectPersistentDeviceDataById(state, device?.id),
    ],
    (device, previousData) => {
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData });

        return deviceInvariabilityCheck(dto).success;
    },
);

export const selectDelegatedIdentityKeyByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceData, (_state, deviceId: string) => deviceId],
    (persistentDeviceData, deviceId) =>
        persistentDeviceData.find(d => d.device_id === deviceId)?.delegatedIdentityKey ?? null,
);
