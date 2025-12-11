import { Dispatch } from '@reduxjs/toolkit';

import { TurnOffSuiteSync, TurnOffSuiteSyncForWalletDep } from '@suite-common/suite-sync-types';
import { SuiteSyncOwner } from '@suite-common/suite-types';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type CreateTurnOffSuiteSyncDeps = {
    getAllDevicesOwners: () => SuiteSyncOwner[];
    dispatch: Dispatch;
    getState: () => any;
} & TurnOffSuiteSyncForWalletDep;

export const createTurnOffSuiteSync =
    (deps: CreateTurnOffSuiteSyncDeps): TurnOffSuiteSync =>
    async () => {
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(deps.getState());

        if (!isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }));

        await Promise.all(
            deps.getAllDevicesOwners().map(owner => deps.turnOffSuiteSyncForWallet({ owner })),
        );
    };
