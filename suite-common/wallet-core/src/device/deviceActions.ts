import { createAction } from '@reduxjs/toolkit';

import { ButtonRequest, TrezorDevice } from '@suite-common/suite-types';
import { WalletType } from '@suite-common/wallet-types';
import { DEVICE, Device, DeviceState } from '@trezor/connect';

import { PORTFOLIO_TRACKER_DEVICE_ID } from './deviceConstants';

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

const updatePassphraseMode = createAction(
    `${DEVICE_MODULE_PREFIX}/updatePassphraseMode`,
    (payload: { device: TrezorDevice; hidden: boolean; alwaysOnDevice?: boolean }) => ({ payload }),
);

const updateDeviceState = createAction(
    `${DEVICE_MODULE_PREFIX}/updateDeviceState`,
    (payload: { device: TrezorDevice; state: DeviceState }) => ({ payload }),
);

const deviceAuthorizationFailed = createAction(
    `${DEVICE_MODULE_PREFIX}/deviceAuthorizationFailed`,
    (payload: { device: TrezorDevice; error: string }) => ({ payload }),
);

const addDeviceInstance = createAction(
    `${DEVICE_MODULE_PREFIX}/addDeviceInstance`,
    (payload: { device: TrezorDevice }) => ({ payload }),
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

const setTemporaryRememberedDevice = createAction(
    `${DEVICE_MODULE_PREFIX}/setTemporaryRememberedDevice`,
    (payload: { device: TrezorDevice; temporaryRemember: boolean }) => ({ payload }),
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

const setEntropyCheckFail = createAction(
    `${DEVICE_MODULE_PREFIX}/setEntropyCheckFail`,
    (payload: string | null) => ({ payload }),
);

/**
 * Action handler: SUITE.CREATE_DEVICE_INSTANCE
 * @param {DeviceReducerState} draft
 * @param {TrezorDevice} device
 * @returns
 */
export const createInstance = (device: TrezorDevice): TrezorDevice => {
    const isPortfolioTrackerDevice = device.id === PORTFOLIO_TRACKER_DEVICE_ID;

    const currentTime = new Date().getTime();

    return {
        ...device,
        passphraseOnDevice: false,
        remember: isPortfolioTrackerDevice,
        // In mobile app, we need to keep device state defined by the constant
        // to be able to filter device accounts for portfolio tracker
        state: isPortfolioTrackerDevice ? device.state : undefined,
        walletNumber: undefined,
        authConfirm: false,
        firstConnectedTimestamp: device.firstConnectedTimestamp ?? currentTime,
        ts: currentTime,
        buttonRequests: [],
        metadata: {},
        passwords: {},
    } as TrezorDevice;
};

export const deviceActions = {
    connectDevice,
    connectUnacquiredDevice,
    deviceChanged,
    deviceDisconnect,
    dismissFirmwareAuthenticityCheck,
    updatePassphraseMode,
    receiveAuthConfirm,
    rememberDevice,
    setTemporaryRememberedDevice,
    forgetDevice,
    addButtonRequest,
    requestDeviceReconnect,
    selectDevice,
    updateSelectedDevice,
    removeButtonRequests,
    deviceAuthorizationFailed,
    updateDeviceState,
    addDeviceInstance,
    setEntropyCheckFail,
};
