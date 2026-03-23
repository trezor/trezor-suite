import { type Dispatch } from '@reduxjs/toolkit';

import { PORTFOLIO_TRACKER_DEVICE_STATE } from '@suite-common/device';
import {
    type EnsureWalletSuiteSyncOnDep,
    type TurnOnSuiteSync,
} from '@suite-common/suite-sync-types';
import { ok } from '@trezor/type-utils';

import { updateSuiteSyncEnabled } from './suiteSyncSlice';

export type CreateTurnOnSuiteSyncDeps = {
    getIsSuiteSyncEnabled: () => boolean;
    dispatch: Dispatch;
} & EnsureWalletSuiteSyncOnDep;

export const createTurnOnSuiteSync =
    (deps: CreateTurnOnSuiteSyncDeps): TurnOnSuiteSync =>
    async ({ deviceStaticSessionId }) => {
        const isSuiteSyncEnabled = deps.getIsSuiteSyncEnabled();

        if (isSuiteSyncEnabled) {
            return ok();
        }

        deps.dispatch(updateSuiteSyncEnabled({ isEnabled: true }));

        if (
            deviceStaticSessionId !== undefined &&
            deviceStaticSessionId !== PORTFOLIO_TRACKER_DEVICE_STATE
        ) {
            const result = await deps.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
                isWriteMode: false,
            });

            if (!result.success) {
                return result;
            }
        }

        return ok();
    };
