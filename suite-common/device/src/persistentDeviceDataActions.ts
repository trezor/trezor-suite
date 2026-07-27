import { createAction } from '@reduxjs/toolkit';

import type {
    AcquiredDevice,
    PersistentDeviceData,
    StoredAuthenticateDeviceResult,
    TrezorDevice,
} from '@suite-common/suite-types';
import { type EntropyCheckResult } from '@trezor/connect';

import { DEVICE_MODULE_PREFIX } from './deviceConstants';

// Forget persistent deviceReducer data for a device. See `forgetSingleDevicePersistentDataThunk` for all device-associated data.
const forgetDevicePersistentData = createAction(
    `${DEVICE_MODULE_PREFIX}/forgetDevicePersistentData`,
    (payload: { deviceId: AcquiredDevice['id'] }) => ({ payload }),
);

const clearDevicePersistentData = createAction(`${DEVICE_MODULE_PREFIX}/clearDevicePersistentData`);

type SetEntropyCheckResultParams = { deviceId: AcquiredDevice['id'] } & EntropyCheckResult;
const setEntropyCheckResult = createAction(
    `${DEVICE_MODULE_PREFIX}/setEntropyCheckResult`,
    (payload: SetEntropyCheckResultParams) => ({ payload }),
);

type SetDelegatedIdentityKeyParams = {
    deviceId: string;
    delegatedKey: PersistentDeviceData['delegatedIdentityKey'];
};

const setDelegatedIdentityKey = createAction(
    `${DEVICE_MODULE_PREFIX}/setDelegatedIdentityKey`,
    ({ deviceId, delegatedKey }: SetDelegatedIdentityKeyParams) => ({
        payload: { deviceId, delegatedKey },
    }),
);

const setDeviceAuthenticityResult = createAction(
    `${DEVICE_MODULE_PREFIX}/setDeviceAuthenticityResult`,
    (payload: { deviceId: TrezorDevice['id']; result: StoredAuthenticateDeviceResult }) => ({
        payload,
    }),
);

const setManualDeviceCheckSuccess = createAction(
    `${DEVICE_MODULE_PREFIX}/setManualDeviceCheckSuccess`,
    (payload: { deviceId: TrezorDevice['id'] }) => ({ payload }),
);

export const persistentDeviceDataActions = {
    forgetDevicePersistentData,
    clearDevicePersistentData,
    setEntropyCheckResult,
    setDelegatedIdentityKey,
    setDeviceAuthenticityResult,
    setManualDeviceCheckSuccess,
};
