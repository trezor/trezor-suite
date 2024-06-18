import { createAction } from '@reduxjs/toolkit';

import { Device, DEVICE } from '@trezor/connect';
import { ButtonRequest, TrezorDevice } from '@suite-common/suite-types';
import { WalletType } from '@suite-common/wallet-types';

export const DEVICE_MODULE_PREFIX = '@suite/device';

export type ConnectDeviceSettings = {
    defaultWalletLoading: WalletType;
    isViewOnlyModeVisible: boolean;
};

export type DeviceConnectActionPayload = { device: Device; settings: ConnectDeviceSettings };

const connectDevice = createAction(DEVICE.CONNECT, (payload: DeviceConnectActionPayload) => ({
    payload,
}));

const connectUnacquiredDevice = createAction(
    DEVICE.CONNECT_UNACQUIRED,
    (payload: { device: Device; settings: ConnectDeviceSettings }) => ({ payload }),
);

const deviceChanged = createAction(DEVICE.CHANGED, (payload: Device | TrezorDevice) => ({
    payload,
}));

const deviceDisconnect = createAction(DEVICE.DISCONNECT, (payload: Device) => ({ payload }));

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
    (payload: { device: TrezorDevice; remember: boolean; forceRemember: undefined | true }) => ({
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

export const deviceActions = {
    connectDevice,
    connectUnacquiredDevice,
    deviceChanged,
    deviceDisconnect,
    updatePassphraseMode,
    receiveAuthConfirm,
    rememberDevice,
    forgetDevice,
    addButtonRequest,
    requestDeviceReconnect,
    selectDevice,
    updateSelectedDevice,
    removeButtonRequests,
};
