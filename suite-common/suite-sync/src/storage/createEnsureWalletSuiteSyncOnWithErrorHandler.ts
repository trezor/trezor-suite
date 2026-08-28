import { type Dispatch } from '@reduxjs/toolkit';

import {
    type EnsureWalletSuiteSyncOn,
    type EnsureWalletSuiteSyncOnDep,
} from '@suite-common/suite-sync-types';
import { exhaustive } from '@trezor/type-utils';

import { resetSuiteSyncError, setSuiteSyncError } from '../suiteSyncSlice';

export type EnsureWalletSuiteSyncOnWithErrorHandlerDeps = {
    dispatch: Dispatch;
} & EnsureWalletSuiteSyncOnDep;

/**
 * Decorator for `ensureWalletSuiteSyncOn` that handles dispatching of all
 * suite sync errors to the Redux store.
 */
export const createEnsureWalletSuiteSyncOnWithErrorHandler =
    (deps: EnsureWalletSuiteSyncOnWithErrorHandlerDeps): EnsureWalletSuiteSyncOn =>
    async params => {
        const result = await deps.ensureWalletSuiteSyncOn(params);

        if (!result.success) {
            const { type } = result.error;

            switch (type) {
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                case 'SuiteSyncUnavailableOnDeviceError':
                case 'DeviceCancelled':
                case 'DeviceError':
                case 'DeviceNotConnectedError':
                    deps.dispatch(
                        setSuiteSyncError({
                            deviceStaticSessionId: params.deviceStaticSessionId,
                            error: result.error,
                        }),
                    );
                    break;

                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    break;

                case 'QuotaManagerCommunicationFailed':
                    return result; // This is edge-case handled only imperatively by showing the toast notification.

                default:
                    exhaustive(type);
            }
        } else {
            deps.dispatch(
                resetSuiteSyncError({
                    deviceStaticSessionId: params.deviceStaticSessionId,
                }),
            );
        }

        return result;
    };
