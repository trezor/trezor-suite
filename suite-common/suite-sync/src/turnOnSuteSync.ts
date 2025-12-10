import {
    CreateTurnOnSuiteSyncDeps,
    TurnOnSuiteSync,
} from '@suite-common/suite-sync-types/src/turnOnSuteSync';
import { selectDevices } from '@suite-common/wallet-core';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export const createTurnOnSuiteSync =
    (deps: CreateTurnOnSuiteSyncDeps): TurnOnSuiteSync =>
    () => {
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(deps.getState());

        if (isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));

        // Turn on and subscribe labeling for all wallets.
        const devices = selectDevices(deps.getState());
        devices?.forEach(device => {
            deps.turnOnSuiteSyncForWallet({ staticSessionId: device?.state?.staticSessionId });
        });
    };
