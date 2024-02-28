import { createAction } from '@reduxjs/toolkit';

import { FirmwareStatus } from '@suite-common/suite-types';
import { FirmwareType } from '@trezor/connect';

export const firmwareActionsPrefix = '@common/wallet-core/firmware';

const setStatus = createAction(
    `${firmwareActionsPrefix}/set-update-status`,
    (payload: FirmwareStatus | 'error') => ({ payload }),
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

const toggleHasSeed = createAction(`${firmwareActionsPrefix}/toggle-has-seed`);

const setTargetType = createAction(
    `${firmwareActionsPrefix}/set-target-type`,
    (payload: FirmwareType) => ({
        payload,
    }),
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
    setHashInvalid,
    setError,
    toggleHasSeed,
    setTargetType,
    setIsCustomFirmware,
    resetReducer,
    toggleUseDevkit,
};
