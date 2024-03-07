import { createAction } from '@reduxjs/toolkit';

import { FirmwareStatus } from '@suite-common/suite-types';
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

const setError = createAction(`${FIRMWARE_MODULE_PREFIX}/set-error`, (payload?: string) => ({
    payload,
}));

const toggleHasSeed = createAction(`${FIRMWARE_MODULE_PREFIX}/toggle-has-seed`);

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

export const firmwareActions = {
    setStatus,
    setHashInvalid,
    setError,
    toggleHasSeed,
    setTargetType,
    setIsCustomFirmware,
    resetReducer,
    toggleUseDevkit,
};
