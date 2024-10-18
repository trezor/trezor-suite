import { createAction } from '@reduxjs/toolkit';

import { FirmwareStatus, TrezorDevice } from '@suite-common/suite-types';
import { FirmwareType } from '@trezor/connect';

export const FIRMWARE_MODULE_PREFIX = '@common/wallet-core/firmware';

const setStatus = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-update-status`,
    (payload: FirmwareStatus | 'error') => ({ payload }),
);

const setHashInvalid = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-hash-invalid`,
    (payload: string) => ({
        payload,
    }),
);

const clearInvalidHash = createAction(
    `${FIRMWARE_MODULE_PREFIX}/clear-invalid-hash`,
    (payload: string) => ({
        payload,
    }),
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

export const firmwareActions = {
    setHashInvalid,
    clearInvalidHash,
    setStatus,
    setFirmwareUpdateError,
    setTargetType,
    setIsCustomFirmware,
    resetReducer,
    toggleUseDevkit,
    cacheDevice,
};
