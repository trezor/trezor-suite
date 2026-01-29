import { Dispatch } from '@reduxjs/toolkit';

import {
    EnsureWalletSuiteSyncOn,
    RefreshSuiteSyncKeysDep,
    SubscribeSuiteSyncDataDep,
    SubscriptionStorageDep,
} from '@suite-common/suite-sync-types';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { err, exhaustive } from '@trezor/type-utils';

import { setSuiteSyncError } from '../suiteSyncSlice';
import { isFwUpgradeNeededForSuiteSync, isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

export type EnsureWalletSuiteSyncOnDeps = {
    dispatch: Dispatch;
    getState: () => any;
} & SubscribeSuiteSyncDataDep &
    RefreshSuiteSyncKeysDep &
    SubscriptionStorageDep;

export const createEnsureWalletSuiteSyncOn =
    (deps: EnsureWalletSuiteSyncOnDeps): EnsureWalletSuiteSyncOn =>
    async ({ deviceStaticSessionId, isWriteMode }) => {
        const device = selectDeviceByStaticSessionId(deps.getState(), deviceStaticSessionId);

        if (isFwUpgradeNeededForSuiteSync(device)) {
            return err({ type: 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType' });
        }

        const canTurnOnSuiteSync =
            device && isTrezorDeviceWithState(device) && isSuiteSyncSupportedByDevice(device);

        if (!canTurnOnSuiteSync) {
            return err({ type: 'SuiteSyncUnavailableOnDeviceError' });
        }

        const result = await deps.ensureSuiteSyncData({
            deviceStaticSessionId,
            isWriteMode,
        });

        if (!result.success) {
            const { type } = result.error;

            switch (type) {
                case 'DeviceCancelled':
                case 'DeviceError':
                    deps.dispatch(setSuiteSyncError({ error: result.error }));
                    break;

                case 'SuiteSyncUnavailableOnDeviceError':
                    // This error is now not handled in the UI, so we don't need to set the error. It will probably be added as a follow up.
                    deps.dispatch(setSuiteSyncError({ error: null }));
                    break;

                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    break;

                default:
                    exhaustive(type);
            }
        } else {
            deps.dispatch(setSuiteSyncError({ error: null }));
        }

        return result;
    };
