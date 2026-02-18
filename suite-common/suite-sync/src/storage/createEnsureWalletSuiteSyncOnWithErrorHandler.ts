import { Dispatch } from '@reduxjs/toolkit';

import {
    EnsureWalletSuiteSyncOn,
    EnsureWalletSuiteSyncOnDep,
} from '@suite-common/suite-sync-types';
import { exhaustive } from '@trezor/type-utils';

import { setSuiteSyncError } from '../suiteSyncSlice';

export type CreateEnsureWalletSuiteSyncOnWithFwCheckDeps = {
    dispatch: Dispatch;
} & EnsureWalletSuiteSyncOnDep;

/**
 * Decorator for connection of the ensureWalletSuiteSyncOn` error handling
 * into Redux. If any error happens, in this decorator we semi-globally
 * convert this error into Redux state, so we can declaratively have the information
 * that for this Wallet (Device), the SuiteSync turn-on failed.
 */
export const createEnsureWalletSuiteSyncOnWithErrorHandler =
    (deps: CreateEnsureWalletSuiteSyncOnWithFwCheckDeps): EnsureWalletSuiteSyncOn =>
    async params => {
        const result = await deps.ensureWalletSuiteSyncOn(params);

        if (!result.success) {
            const { type } = result.error;

            switch (type) {
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                case 'DeviceCancelled':
                case 'DeviceError':
                    deps.dispatch(
                        setSuiteSyncError({
                            deviceStaticSessionId: params.deviceStaticSessionId,
                            error: result.error,
                        }),
                    );
                    break;

                case 'SuiteSyncUnavailableOnDeviceError':
                    // This error is now not handled in the UI, so we don't need to set the error. It will probably be added as a follow up.
                    deps.dispatch(
                        setSuiteSyncError({
                            deviceStaticSessionId: params.deviceStaticSessionId,
                            error: null,
                        }),
                    );
                    break;

                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    break;

                default:
                    exhaustive(type);
            }
        } else {
            deps.dispatch(
                setSuiteSyncError({
                    deviceStaticSessionId: params.deviceStaticSessionId,
                    error: null,
                }),
            );
        }

        return result;
    };
