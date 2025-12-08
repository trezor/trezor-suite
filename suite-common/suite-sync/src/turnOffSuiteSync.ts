import { useSelector } from 'react-redux';

import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncOwner } from '@suite-common/suite-types';

import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type TurnOffSuiteSync = () => Promise<void>;

export type TurnOffSuiteSyncDep = { turnOffSuiteSync: TurnOffSuiteSync };

type CreateTurnOffSuiteSyncDeps = {
    getAllDevicesOwners: () => SuiteSyncOwner[];
    dispatch: Dispatch;
} & TurnOffSuiteSyncForWalletDep;

export const createTurnOffSuiteSync =
    (deps: CreateTurnOffSuiteSyncDeps): TurnOffSuiteSync =>
    async () => {
        const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

        if (!isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }));

        await Promise.all(
            deps.getAllDevicesOwners().map(owner => deps.turnOffSuiteSyncForWallet({ owner })),
        );
    };
