import { Dispatch } from '@reduxjs/toolkit';

import { quotaManagerEnabledUpdated } from '@suite-common/suite-sync-quota-manager';
import { EnsureWalletSuiteSyncOnDep, TurnOnSuiteSync } from '@suite-common/suite-sync-types';
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

        deps.dispatch(
            quotaManagerEnabledUpdated({
                isEnabled: true,
            }),
        );

        if (deviceStaticSessionId !== undefined) {
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
