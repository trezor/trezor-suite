import { Dispatch } from '@reduxjs/toolkit';

import { TurnOnSuiteSync } from '@suite-common/suite-sync-types';
import { EnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types/src/storage/ensureWalletSuiteSyncOn';
import { ok } from '@trezor/type-utils';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type CreateTurnOnSuiteSyncDeps = {
    getState: () => any;
    dispatch: Dispatch;
} & EnsureWalletSuiteSyncOnDep;

export const createTurnOnSuiteSync =
    (deps: CreateTurnOnSuiteSyncDeps): TurnOnSuiteSync =>
    async ({ deviceStaticSessionId }) => {
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(deps.getState());

        if (isSuiteSyncEnabled) {
            return ok();
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));

        if (deviceStaticSessionId !== undefined) {
            const result = await deps.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
            });

            if (!result.success) {
                return result;
            }
        }

        return ok();
    };
