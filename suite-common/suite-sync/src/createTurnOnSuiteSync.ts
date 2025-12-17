import { Dispatch } from '@reduxjs/toolkit';

import { TurnOnSuiteSync, TurnOnSuiteSyncForWallet } from '@suite-common/suite-sync-types';
import { selectDevices } from '@suite-common/wallet-core';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type CreateTurnOnSuiteSyncDeps = {
    getState: () => any;
    dispatch: Dispatch;
    turnOnSuiteSyncForWallet: TurnOnSuiteSyncForWallet;
};

export const createTurnOnSuiteSync =
    (deps: CreateTurnOnSuiteSyncDeps): TurnOnSuiteSync =>
    async () => {
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(deps.getState());

        if (isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));

        // Turn on and subscribe labeling for all wallets.
        const devices = selectDevices(deps.getState());

        for (const device of devices) {
            if (device?.state?.staticSessionId) {
                const result = await deps.turnOnSuiteSyncForWallet({
                    deviceStaticSessionId: device.state.staticSessionId,
                });

                if (!result.ok) {
                    // Todo: notification? Here or in the caller?
                    console.error('[createTurnOnSuiteSync] error', result.error);
                }
            }
        }
    };
