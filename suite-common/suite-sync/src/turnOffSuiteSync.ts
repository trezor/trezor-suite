import { CreateTurnOffSuiteSyncDeps, TurnOffSuiteSync } from '@suite-common/suite-sync-types';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

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
