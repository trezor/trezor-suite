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

import { setSuiteSyncError } from '../suiteSyncReducer';
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

        if (isFwUpgradeNeededForSuiteSync(device)) {
            return err({ type: 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType' });
        }

        const canTurnOnSuiteSync =
            device && isTrezorDeviceWithState(device) && isSuiteSyncSupportedByDevice(device);

        if (!canTurnOnSuiteSync) {
            return err({ type: 'SuiteSyncUnavailableOnDeviceError' });
        }

        const result = await deps.ensureSuiteSyncData({ deviceStaticSessionId });

        if (
            !result.success &&
            (result.error.type === 'DeviceCancelled' || result.error.type === 'DeviceError')
        ) {
            deps.dispatch(setSuiteSyncError({ error: result.error.type }));
        } else {
            deps.dispatch(setSuiteSyncError({ error: null }));
        }

        return result;
    };
