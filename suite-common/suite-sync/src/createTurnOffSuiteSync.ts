import { type Dispatch } from '@reduxjs/toolkit';

import { eraseFetchedData } from '@suite-common/suite-sync-quota-manager';
import {
    type SuiteSyncAppReloaderDep,
    type TurnOffSuiteSync,
    type TurnOffSuiteSyncForWalletDep,
} from '@suite-common/suite-sync-types';
import { type StaticSessionId } from '@trezor/connect';

import { clearAll } from './data/suiteSyncDataReducer';
import { updateSuiteSyncEnabled } from './suiteSyncSlice';

export type CreateTurnOffSuiteSyncDeps = {
    getIsSuiteSyncEnabled: () => boolean;
    dispatch: Dispatch;
    getAllDeviceSessionIds: () => StaticSessionId[];
} & TurnOffSuiteSyncForWalletDep &
    SuiteSyncAppReloaderDep;

export const createTurnOffSuiteSync =
    (deps: CreateTurnOffSuiteSyncDeps): TurnOffSuiteSync =>
    async (params: { ensureSettingsPersisted?: () => Promise<void> } = {}) => {
        const isSuiteSyncEnabled = deps.getIsSuiteSyncEnabled();

        if (!isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(updateSuiteSyncEnabled({ isEnabled: false }));
        deps.dispatch(eraseFetchedData());

        const deviceStaticSessionIds = deps.getAllDeviceSessionIds();

        for (const deviceStaticSessionId of deviceStaticSessionIds) {
            await deps.turnOffSuiteSyncForWallet({ deviceStaticSessionId });
        }

        // NOTE: enforce clearing all data from the suite sync
        deps.dispatch(clearAll());
        if (params.ensureSettingsPersisted) {
            await params.ensureSettingsPersisted();
        }

        // NOTE: this is TEMPORARY solution until https://github.com/trezor/trezor-suite/issues/23641 is resolved
        deps.reloadApp();
    };
