import { createAction } from '@reduxjs/toolkit';

import { EncryptedHex } from '@suite-common/platform-encryption';
import {
    AcquiredDevice,
    ButtonRequest,
    DelegatedIdentityKey,
    StoredAuthenticateDeviceResult,
    SuiteSyncOwnerSerialized,
    ThpSuiteCredentials,
    TrezorDevice,
} from '@suite-common/suite-types';
import {
    DEVICE,
    DecodedTrezorPushNotification,
    Device,
    DeviceState,
    StaticSessionId,
    Unsuccessful,
} from '@trezor/connect';

export const DEVICE_MODULE_PREFIX = '@suite/device';

export type DeviceConnectActionPayload = {
    device: Device;
    isAutoEjectEnabled: boolean;
};

export type DeviceStateActionPayload = {
    device: AcquiredDevice;
    state: DeviceState & { staticSessionId: StaticSessionId };
    useEmptyPassphrase: boolean;
    isAutoEjectEnabled: boolean;
};

const connectDevice = createAction(DEVICE.CONNECT, (payload: DeviceConnectActionPayload) => ({
    payload,
}));

const createDeviceInstance = createAction(
    `${DEVICE_MODULE_PREFIX}/createDeviceInstance`,
    (payload: { device: TrezorDevice }) => ({ payload }),
);

const connectUnacquiredDevice = createAction(
    DEVICE.CONNECT_UNACQUIRED,
    (payload: DeviceConnectActionPayload) => ({
        payload,
    }),
);

const deviceChanged = createAction(DEVICE.CHANGED, (payload: Device) => ({
    payload,
}));

const devicePushNotification = createAction(
    DEVICE.TREZOR_PUSH_NOTIFICATION,
    (payload: DecodedTrezorPushNotification & { device: Device }) => ({
        payload,
    }),
);

const setDeviceState = createAction(
    `${DEVICE_MODULE_PREFIX}/set-device-state`,
    (payload: DeviceStateActionPayload) => ({ payload }),
);

const addAuthorizedDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/addAuthorizedDevice`,
    (payload: DeviceStateActionPayload) => ({ payload }),
);

const deviceDisconnect = createAction(DEVICE.DISCONNECT, (payload: TrezorDevice) => ({
    payload,
}));

const setRememberDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/setRememberDevice`,
    (payload: { device: TrezorDevice; remember: boolean }) => ({ payload }),
);

const setTemporaryRememberedDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/setTemporaryRememberedDevice`,
    (payload: { device: TrezorDevice; temporaryRemember: boolean }) => ({ payload }),
);

const forgetDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/forgetDevice`,
    (payload: { device: TrezorDevice }) => ({ payload }),
);

// Forget persistent deviceReducer data for a device. See `forgetSingleDevicePersistentDataThunk` for all device-associated data.
const forgetDevicePersistentData = createAction(
    `${DEVICE_MODULE_PREFIX}/forgetDevicePersistentData`,
    (payload: { deviceId: AcquiredDevice['id'] }) => ({ payload }),
);

// Forget persistent deviceReducer data for all devices. See `forgetAllDevicesPersistentDataThunk` for all device-associated data.
const forgetAllDevicesPersistentData = createAction(
    `${DEVICE_MODULE_PREFIX}/forgetAllDevicesPersistentData`,
);

const addButtonRequest = createAction(
    `${DEVICE_MODULE_PREFIX}/addButtonRequest`,
    (payload: { device?: TrezorDevice; buttonRequest: ButtonRequest }) => ({ payload }),
);

const requestDeviceReconnect = createAction(`${DEVICE_MODULE_PREFIX}/requestDeviceReconnect`);

const selectDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/selectDevice`,
    (payload?: TrezorDevice) => ({
        payload,
    }),
);

const updateSelectedDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/updateSelectedDevice`,
    (payload: TrezorDevice) => ({ payload }),
);

// Remove button requests for specific device by button request code or all button requests if no code is provided.
export const removeButtonRequests = createAction(
    `${DEVICE_MODULE_PREFIX}/removeButtonRequests`,
    (payload: { device?: TrezorDevice; buttonRequestCode?: ButtonRequest['code'] }) => ({
        payload,
    }),
);

const dismissFirmwareAuthenticityCheck = createAction(
    `${DEVICE_MODULE_PREFIX}/dismissFirmwareAuthenticityCheck`,
    (payload: string) => ({ payload }),
);

const setEntropyCheckResult = createAction(
    `${DEVICE_MODULE_PREFIX}/setEntropyCheckResult`,
    (payload: { deviceId: AcquiredDevice['id']; success: boolean }) => ({ payload }),
);

const setThpCredentials = createAction(
    `${DEVICE_MODULE_PREFIX}/setThpCredentials`,
    ({ credentials }: { credentials: ThpSuiteCredentials[] }) => ({
        payload: { credentials },
    }),
);

const setSuiteSyncOwner = createAction(
    `${DEVICE_MODULE_PREFIX}/setSuiteSyncOwner`,
    ({
        deviceStaticId,
        owner,
    }: {
        deviceStaticId: StaticSessionId;
        owner: EncryptedHex<SuiteSyncOwnerSerialized> | null;
    }) => ({
        payload: { deviceStaticId, owner },
    }),
);

type SetDelegatedIdentityKeyParams = {
    deviceId: string;
    delegatedKey: EncryptedHex<DelegatedIdentityKey> | null;
};

const setDelegatedIdentityKey = createAction(
    `${DEVICE_MODULE_PREFIX}/setDelegatedIdentityKey`,
    ({ deviceId, delegatedKey }: SetDelegatedIdentityKeyParams) => ({
        payload: { deviceId, delegatedKey },
    }),
);

const setDiscovered = createAction(
    `${DEVICE_MODULE_PREFIX}/setDiscovered`,
    (staticSessionId: StaticSessionId, success: boolean) => ({
        payload: { staticSessionId, success },
    }),
);

const setDeviceAuthenticityResult = createAction(
    `${DEVICE_MODULE_PREFIX}/setDeviceAuthenticityResult`,
    (payload: { device: TrezorDevice; result: StoredAuthenticateDeviceResult }) => ({
        payload,
    }),
);

// Use in tests only! See deviceReducer for the property definition.
const setSimulatedEntropyCheckFail = createAction(
    `${DEVICE_MODULE_PREFIX}/setSimulatedEntropyCheckFail`,
    (payload: Unsuccessful) => ({ payload }),
);

export const deviceActions = {
    connectDevice,
    createDeviceInstance,
    connectUnacquiredDevice,
    deviceChanged,
    setDeviceState,
    addAuthorizedDevice,
    deviceDisconnect,
    dismissFirmwareAuthenticityCheck,
    setRememberDevice,
    setTemporaryRememberedDevice,
    forgetDevice,
    forgetDevicePersistentData,
    forgetAllDevicesPersistentData,
    addButtonRequest,
    requestDeviceReconnect,
    selectDevice,
    updateSelectedDevice,
    removeButtonRequests,
    setEntropyCheckResult,
    setThpCredentials,
    setDelegatedIdentityKey,
    setSuiteSyncOwner,
    setDiscovered,
    devicePushNotification,
    setDeviceAuthenticityResult,
    setSimulatedEntropyCheckFail,
};
