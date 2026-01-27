import { Dispatch } from '@reduxjs/toolkit';

import {
    SuiteSyncAppReloaderDep,
    TurnOffSuiteSync,
    TurnOffSuiteSyncForWalletDep,
} from '@suite-common/suite-sync-types';
import { StaticSessionId } from '@trezor/connect';

import { clearAll } from './data/suiteSyncDataReducer';
import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type CreateTurnOffSuiteSyncDeps = {
    dispatch: Dispatch;
    getState: () => any;
    getAllDeviceSessionIds: () => StaticSessionId[];
} & TurnOffSuiteSyncForWalletDep &
    SuiteSyncAppReloaderDep;

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

        // NOTE: enforce clearing all data from the suite sync
        deps.dispatch(clearAll());
        // NOTE: this is TEMPORARY solution until https://github.com/trezor/trezor-suite/issues/23641 is resolved
        deps.reloadApp();
    };
