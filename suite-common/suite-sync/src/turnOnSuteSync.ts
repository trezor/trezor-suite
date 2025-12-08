import { useSelector } from 'react-redux';

import {
    CreateTurnOnSuiteSyncDeps,
    TurnOnSuiteSync,
} from '@suite-common/suite-sync-types/src/turnOnSuteSync';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

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
