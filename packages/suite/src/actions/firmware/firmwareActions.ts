import { createAction } from '@reduxjs/toolkit';

import { AcquiredDevice, FirmwareStatus } from '@suite-common/suite-types';
import { Device, FirmwareType } from '@trezor/connect';

export const MODULE_PREFIX = '@firmware';

const setStatus = createAction(
    `${MODULE_PREFIX}/set-update-status`,
    (payload: FirmwareStatus | 'error') => ({ payload }),
);

const setHash = createAction(
    `${MODULE_PREFIX}/set-hash`,
    (payload: { hash: string; challenge: string }) => ({ payload }),
);

const setHashInvalid = createAction(`${MODULE_PREFIX}/set-hash-invalid`, (payload: string) => ({
    payload,
}));

const setError = createAction(`${MODULE_PREFIX}/set-error`, (payload?: string) => ({
    payload,
}));

const setTargetRelease = createAction(
    `${MODULE_PREFIX}/set-target-release`,
    (payload: AcquiredDevice['firmwareRelease']) => ({ payload }),
);

const toggleHasSeed = createAction(`${MODULE_PREFIX}/toggle-has-seed`);

const setIntermediaryInstalled = createAction(
    `${MODULE_PREFIX}/set-intermediary-installed`,
    (payload: boolean) => ({ payload }),
);

const setTargetType = createAction(`${MODULE_PREFIX}/set-target-type`, (payload: FirmwareType) => ({
    payload,
}));

const rememberPreviousDevice = createAction(
    `${MODULE_PREFIX}/remember-previous-device`,
    (payload: Device) => ({ payload }),
);

const setIsCustomFirmware = createAction(`${MODULE_PREFIX}/set-is-custom`, (payload: boolean) => ({
    payload,
}));

const resetReducer = createAction(`${MODULE_PREFIX}/reset-reducer`);

const toggleUseDevkit = createAction(`${MODULE_PREFIX}/toggle-use-devkit`, (payload: boolean) => ({
    payload,
}));

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
