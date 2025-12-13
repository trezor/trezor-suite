import { Dispatch } from '@reduxjs/toolkit';

import { TurnOffSuiteSync, TurnOffSuiteSyncForWalletDep } from '@suite-common/suite-sync-types';
import { StaticSessionId } from '@trezor/connect';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type CreateTurnOffSuiteSyncDeps = {
    dispatch: Dispatch;
    getState: () => any;
    getAllDeviceSessionIds: () => StaticSessionId[];
} & TurnOffSuiteSyncForWalletDep;

export const createTurnOffSuiteSync =
    (deps: CreateTurnOffSuiteSyncDeps): TurnOffSuiteSync =>
    async () => {
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(deps.getState());

        if (!isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }));

        const deviceStaticSessionIds = deps.getAllDeviceSessionIds();

        for (const deviceStaticSessionId of deviceStaticSessionIds) {
            await deps.turnOffSuiteSyncForWallet({ deviceStaticSessionId });
        }
    };
