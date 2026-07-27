import { createAction } from '@reduxjs/toolkit';

import type { AcquiredDevice, ButtonRequest, TrezorDevice } from '@suite-common/suite-types';
import {
    DEVICE,
    type DecodedTrezorPushNotification,
    type Device,
    type DeviceState,
    type StaticSessionId,
} from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Err } from '@trezor/type-utils';

import { DEVICE_MODULE_PREFIX } from './deviceConstants';
import { persistentDeviceDataActions } from './persistentDeviceDataActions';

export type DeviceConnectActionPayload = {
    device: Device;
};

export type DeviceStateActionPayload = {
    device: AcquiredDevice;
    state: DeviceState & { staticSessionId: StaticSessionId };
    useEmptyPassphrase: boolean;
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
const removeButtonRequests = createAction(
    `${DEVICE_MODULE_PREFIX}/removeButtonRequests`,
    (payload: { device?: TrezorDevice; buttonRequestCode?: ButtonRequest['code'] }) => ({
        payload,
    }),
);

const dismissFirmwareAuthenticityCheck = createAction(
    `${DEVICE_MODULE_PREFIX}/dismissFirmwareAuthenticityCheck`,
    (payload: string) => ({ payload }),
);

const setDiscovered = createAction(
    `${DEVICE_MODULE_PREFIX}/setDiscovered`,
    (staticSessionId: StaticSessionId, success: boolean) => ({
        payload: { staticSessionId, success },
    }),
);

// Use in tests only! See deviceReducer for the property definition.
const setSimulatedEntropyCheckFail = createAction(
    `${DEVICE_MODULE_PREFIX}/setSimulatedEntropyCheckFail`,
    (payload: Err<SerializedError>) => ({ payload }),
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
    ...persistentDeviceDataActions,
    addButtonRequest,
    requestDeviceReconnect,
    selectDevice,
    updateSelectedDevice,
    removeButtonRequests,
    setDiscovered,
    devicePushNotification,
    setSimulatedEntropyCheckFail,
};
