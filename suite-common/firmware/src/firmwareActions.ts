import { createAction } from '@reduxjs/toolkit';

import { type FirmwareStatus, type TrezorDevice } from '@suite-common/suite-types';
import type { FirmwareChannel, FirmwareType } from '@trezor/connect';

export const FIRMWARE_MODULE_PREFIX = '@common/wallet-core/firmware';

const setStatus = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-update-status`,
    (payload: FirmwareStatus | 'error') => ({ payload }),
);

const setFirmwareUpdateError = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-firmware-update-error`,
    (payload?: string) => ({
        payload,
    }),
);

const setTargetType = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-target-type`,
    (payload: FirmwareType) => ({
        payload,
    }),
);

const setSwitchFirmwareType = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-switch-firmware-type`,
    (payload: boolean) => ({
        payload,
    }),
);

const setIsCustomFirmware = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-is-custom`,
    (payload: boolean) => ({
        payload,
    }),
);

const resetReducer = createAction(`${FIRMWARE_MODULE_PREFIX}/reset-reducer`);

const toggleUseDevkit = createAction(
    `${FIRMWARE_MODULE_PREFIX}/toggle-use-devkit`,
    (payload: boolean) => ({
        payload,
    }),
);

const cacheDevice = createAction(
    `${FIRMWARE_MODULE_PREFIX}/cache-device`,
    (payload: TrezorDevice) => ({
        payload,
    }),
);

const setFirmwareChannel = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-firmware-channel`,
    (payload: FirmwareChannel) => ({
        payload,
    }),
);

export const firmwareActions = {
    setStatus,
    setFirmwareUpdateError,
    setTargetType,
    setSwitchFirmwareType,
    setIsCustomFirmware,
    resetReducer,
    toggleUseDevkit,
    cacheDevice,
    setFirmwareChannel,
};
