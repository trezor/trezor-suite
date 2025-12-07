import { useSelector } from 'react-redux';

import { Dispatch } from '@reduxjs/toolkit';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type TurnOnSuiteSync = () => void;

export type TurnOnSuiteSyncDep = { turnOnSuiteSync: TurnOnSuiteSync };

type CreateTurnOnSuiteSyncDeps = {
    getState: () => any;
    dispatch: Dispatch;
};

export const createTurnOnSuiteSync =
    (deps: CreateTurnOnSuiteSyncDeps): TurnOnSuiteSync =>
    () => {
        const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

        if (isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));

        // Todo: iterate over all device and turn them ON
    };
