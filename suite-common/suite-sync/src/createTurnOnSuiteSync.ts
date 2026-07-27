import { type Dispatch } from '@reduxjs/toolkit';

import { PORTFOLIO_TRACKER_DEVICE_STATE } from '@suite-common/device';
import {
    type EnsureWalletSuiteSyncOnDep,
    type TurnOnSuiteSync,
} from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { type GetDeviceForStaticSessionIdDep } from './getDeviceForStaticSessionId';
import { setSuiteSyncError, updateSuiteSyncEnabled } from './suiteSyncSlice';

export type CreateTurnOnSuiteSyncDeps = {
    getIsSuiteSyncEnabled: () => boolean;
    dispatch: Dispatch;
} & EnsureWalletSuiteSyncOnDep &
    GetDeviceForStaticSessionIdDep;

export const createTurnOnSuiteSync =
    (deps: CreateTurnOnSuiteSyncDeps): TurnOnSuiteSync =>
    async ({ deviceStaticSessionId }) => {
        const isSuiteSyncEnabled = deps.getIsSuiteSyncEnabled();
        const isDeviceConnected = deviceStaticSessionId
            ? deps.getDeviceForStaticSessionId(deviceStaticSessionId)?.connected === true
            : false;

        if (isSuiteSyncEnabled) {
            return ok();
        }

        deps.dispatch(updateSuiteSyncEnabled({ isEnabled: true }));

        if (
            deviceStaticSessionId === undefined ||
            deviceStaticSessionId === PORTFOLIO_TRACKER_DEVICE_STATE
        ) {
            return ok();
        }

        if (isDeviceConnected) {
            const result = await deps.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
                isWriteMode: false,
            });

            if (!result.success) {
                return result;
            }
        } else {
            deps.dispatch(
                setSuiteSyncError({
                    deviceStaticSessionId,
                    error: { type: 'DeviceError', message: 'Device not connected.' },
                }),
            );
        }

        return ok();
    };
