import { isTrezorDeviceWithState } from '@suite-common/device';
import {
    type EnsureWalletSuiteSyncOnAsync,
    type EnsureWalletSuiteSyncOnDep,
} from '@suite-common/suite-sync-types';

import { type SuiteSyncAsyncErrorHandlerDep } from '../createSuiteSyncInternalErrorHandler';
import { type GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';

export type CreateEnsureWalletSuiteSyncOnAsyncDeps = EnsureWalletSuiteSyncOnDep &
    SuiteSyncAsyncErrorHandlerDep &
    GetDeviceForStaticSessionIdDep;

export const createEnsureWalletSuiteSyncOnAsync =
    (deps: CreateEnsureWalletSuiteSyncOnAsyncDeps): EnsureWalletSuiteSyncOnAsync =>
    async params => {
        const result = await deps.ensureWalletSuiteSyncOn(params);

        if (result.success) {
            return;
        }

        const device = deps.getDeviceForStaticSessionId(params.deviceStaticSessionId);

        deps.suiteSyncAsyncErrorHandler({
            error: result.error,
            device: device && isTrezorDeviceWithState(device) ? device : null,
        });
    };
