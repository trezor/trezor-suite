import { createAction } from '@reduxjs/toolkit';

import { AcquiredDevice, FirmwareStatus } from '@suite-common/suite-types';
import { Device, FirmwareType } from '@trezor/connect';

export const FIRMWARE_MODULE_PREFIX = '@firmware';

const setStatus = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-update-status`,
    (payload: FirmwareStatus | 'error') => ({ payload }),
);

const setHash = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-hash`,
    (payload: { hash: string; challenge: string }) => ({ payload }),
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

const setTargetRelease = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-target-release`,
    (payload: AcquiredDevice['firmwareRelease']) => ({ payload }),
);

const toggleHasSeed = createAction(`${FIRMWARE_MODULE_PREFIX}/toggle-has-seed`);

const setIntermediaryInstalled = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-intermediary-installed`,
    (payload: boolean) => ({ payload }),
);

const setTargetType = createAction(
    `${FIRMWARE_MODULE_PREFIX}/set-target-type`,
    (payload: FirmwareType) => ({
        payload,
    }),
);

const rememberPreviousDevice = createAction(
    `${FIRMWARE_MODULE_PREFIX}/remember-previous-device`,
    (payload: Device) => ({ payload }),
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
    setHash,
    setHashInvalid,
    setError,
    setTargetRelease,
    toggleHasSeed,
    setIntermediaryInstalled,
    setTargetType,
    rememberPreviousDevice,
    setIsCustomFirmware,
    resetReducer,
    toggleUseDevkit,
};
