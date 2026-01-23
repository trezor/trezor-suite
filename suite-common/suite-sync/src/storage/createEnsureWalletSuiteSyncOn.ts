import { Dispatch } from '@reduxjs/toolkit';

import {
    EnsureWalletSuiteSyncOn,
    RefreshSuiteSyncKeysDep,
    SubscribeSuiteSyncDataDep,
    SubscriptionStorageDep,
} from '@suite-common/suite-sync-types';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { err } from '@trezor/type-utils';

import { isFwUpgradeNeededForSuiteSync, isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

export type EnsureWalletSuiteSyncOnDeps = {
    dispatch: Dispatch;
    getState: () => any;
} & SubscribeSuiteSyncDataDep &
    RefreshSuiteSyncKeysDep &
    SubscriptionStorageDep;

export const createEnsureWalletSuiteSyncOn =
    (deps: EnsureWalletSuiteSyncOnDeps): EnsureWalletSuiteSyncOn =>
    async ({ deviceStaticSessionId }) => {
        const device = selectDeviceByStaticSessionId(deps.getState(), deviceStaticSessionId);

        const canTurnOnSuiteSync =
            device && isTrezorDeviceWithState(device) && isSuiteSyncSupportedByDevice(device);

        if (!canTurnOnSuiteSync) {
            return err({ type: 'SuiteSyncUnavailableOnDeviceError' });
        }

        if (isFwUpgradeNeededForSuiteSync(device)) {
            return err({ type: 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType' });
        }

        return await deps.ensureSuiteSyncData({ deviceStaticSessionId });
    };
