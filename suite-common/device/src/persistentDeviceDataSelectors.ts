import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';

import { type DeviceRootState } from './deviceReducer';
import {
    deviceInvariabilityCheck,
    rawDataToDeviceInvariabilityCheckDTO,
} from './services/deviceInvariabilityCheck';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export const selectPersistentDeviceData = (state: DeviceRootState) =>
    state.device.persistentDeviceData;

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
        (_state: DeviceRootState, deviceId: TrezorDevice['id']) => deviceId,
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
