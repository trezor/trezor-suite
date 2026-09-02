import { type Dispatch } from '@reduxjs/toolkit';

import { eraseFetchedData } from '@suite-common/suite-sync-quota-manager';
import {
    type GetAllDeviceSessionIdsDep,
    type TurnOffSuiteSync,
    type TurnOffSuiteSyncForWalletDep,
} from '@suite-common/suite-sync-types';

import { clearAll } from './data/suiteSyncDataReducer';
import { updateSuiteSyncEnabled } from './suiteSyncSlice';

export type TurnOffSuiteSyncDeps = {
    getIsSuiteSyncEnabled: () => boolean;
    dispatch: Dispatch;
} & GetAllDeviceSessionIdsDep &
    TurnOffSuiteSyncForWalletDep;

export const createTurnOffSuiteSync =
    (deps: TurnOffSuiteSyncDeps): TurnOffSuiteSync =>
    async (params: { ensureSettingsPersisted?: () => Promise<void> } = {}) => {
        const isSuiteSyncEnabled = deps.getIsSuiteSyncEnabled();

        if (!isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(updateSuiteSyncEnabled({ isEnabled: false }));

        const deviceStaticSessionIds = deps.getAllDeviceSessionIds();

        for (const deviceStaticSessionId of deviceStaticSessionIds) {
            await deps.turnOffSuiteSyncForWallet({ deviceStaticSessionId });
        }

        // NOTE: enforce clearing all data from the suite sync
        deps.dispatch(clearAll());
        if (params.ensureSettingsPersisted) {
            await params.ensureSettingsPersisted();
        }

        deps.dispatch(eraseFetchedData());
    };
