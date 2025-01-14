import { createAction } from '@reduxjs/toolkit';

import { ButtonRequest, TrezorDevice } from '@suite-common/suite-types';
import { WalletType } from '@suite-common/wallet-types';
import { DEVICE, Device, DeviceVersionChanged } from '@trezor/connect';

export const DEVICE_MODULE_PREFIX = '@suite/device';

export type ConnectDeviceSettings = {
    defaultWalletLoading: WalletType;
};

export type DeviceConnectActionPayload = { device: Device; settings: ConnectDeviceSettings };

const connectDevice = createAction(DEVICE.CONNECT, (payload: DeviceConnectActionPayload) => ({
    payload,
}));

const connectUnacquiredDevice = createAction(
    DEVICE.CONNECT_UNACQUIRED,
    (payload: DeviceConnectActionPayload) => ({ payload }),
);

const deviceChanged = createAction(DEVICE.CHANGED, (payload: Device | TrezorDevice) => ({
    payload,
}));

const deviceDisconnect = createAction(DEVICE.DISCONNECT, (payload: TrezorDevice) => ({
    payload,
}));

// this action is not used but is required because of the typings
// changed here: https://github.com/trezor/trezor-suite/commit/c02412bccf80da7c827f624b7a7c85cdedf278c5#diff-2e9d057f0bfe2cc92fe50d4ce28838622d9e79fcca010ab8847a0fa288da13fd
// in fact action is dispatched from connectInitThunk same as the rest of events
const deviceFirmwareVersionChanged = createAction(
    DEVICE.FIRMWARE_VERSION_CHANGED,
    (payload: DeviceVersionChanged['payload']) => ({
        payload,
    }),
);

const updatePassphraseMode = createAction(
    `${DEVICE_MODULE_PREFIX}/updatePassphraseMode`,
    (payload: { device: TrezorDevice; hidden: boolean; alwaysOnDevice?: boolean }) => ({ payload }),
);

const receiveAuthConfirm = createAction(
    `${DEVICE_MODULE_PREFIX}/receiveAuthConfirm`,
    (payload: { device: TrezorDevice; success: boolean }) => ({ payload }),
);

const rememberDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/rememberDevice`,
    (payload: { device: TrezorDevice; remember: boolean; forceRemember?: true }) => ({
        payload,
    }),
);

export type ForgetDeviceActionPayload = { device: TrezorDevice; settings: ConnectDeviceSettings };

const forgetDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/forgetDevice`,
    (payload: ForgetDeviceActionPayload) => ({
        payload,
    }),
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
    (payload?: TrezorDevice) => ({ payload }),
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

const setEntropyCheckFail = createAction(
    `${DEVICE_MODULE_PREFIX}/setEntropyCheckFail`,
    (payload: string) => ({ payload }),
);

export const deviceActions = {
    connectDevice,
    connectUnacquiredDevice,
    deviceChanged,
    deviceDisconnect,
    dismissFirmwareAuthenticityCheck,
    updatePassphraseMode,
    receiveAuthConfirm,
    rememberDevice,
    forgetDevice,
    addButtonRequest,
    requestDeviceReconnect,
    selectDevice,
    updateSelectedDevice,
    removeButtonRequests,
    setEntropyCheckFail,
    deviceFirmwareVersionChanged,
};
