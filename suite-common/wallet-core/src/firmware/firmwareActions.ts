import { createAction } from '@reduxjs/toolkit';

import { AcquiredDevice, FirmwareStatus } from '@suite-common/suite-types';
import { Device, FirmwareType } from '@trezor/connect';

export const firmwareActionsPrefix = '@common/wallet-core/firmware';

const setStatus = createAction(
    `${firmwareActionsPrefix}/set-update-status`,
    (payload: FirmwareStatus | 'error') => ({ payload }),
);

const setHash = createAction(
    `${firmwareActionsPrefix}/set-hash`,
    (payload: { hash: string; challenge: string }) => ({ payload }),
);

const setHashInvalid = createAction(
    `${firmwareActionsPrefix}/set-hash-invalid`,
    (payload: string) => ({
        payload,
    }),
);

const setError = createAction(`${firmwareActionsPrefix}/set-error`, (payload?: string) => ({
    payload,
}));

const setTargetRelease = createAction(
    `${firmwareActionsPrefix}/set-target-release`,
    (payload: AcquiredDevice['firmwareRelease']) => ({ payload }),
);

const toggleHasSeed = createAction(`${firmwareActionsPrefix}/toggle-has-seed`);

const setIntermediaryInstalled = createAction(
    `${firmwareActionsPrefix}/set-intermediary-installed`,
    (payload: boolean) => ({ payload }),
);

const setTargetType = createAction(
    `${firmwareActionsPrefix}/set-target-type`,
    (payload: FirmwareType) => ({
        payload,
    }),
);

const rememberPreviousDevice = createAction(
    `${firmwareActionsPrefix}/remember-previous-device`,
    (payload: Device) => ({ payload }),
);

const setIsCustomFirmware = createAction(
    `${firmwareActionsPrefix}/set-is-custom`,
    (payload: boolean) => ({
        payload,
    }),
);

const resetReducer = createAction(`${firmwareActionsPrefix}/reset-reducer`);

const toggleUseDevkit = createAction(
    `${firmwareActionsPrefix}/toggle-use-devkit`,
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
