import { isTrezorDeviceWithState } from '@suite-common/device';
import {
    type EnsureWalletSuiteSyncOnDep,
    type EnsureWalletSuiteSyncOnUncontrolled,
} from '@suite-common/suite-sync-types';

import { type GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';
import { type SuiteSyncUncontrolledErrorHandlerDep } from '../suiteSyncUncontrolledErrorHandler';

export type CreateEnsureWalletSuiteSyncOnUncontrolledDeps = EnsureWalletSuiteSyncOnDep &
    SuiteSyncUncontrolledErrorHandlerDep &
    GetDeviceForStaticSessionIdDep;

export const createEnsureWalletSuiteSyncOnUncontrolled =
    (deps: CreateEnsureWalletSuiteSyncOnUncontrolledDeps): EnsureWalletSuiteSyncOnUncontrolled =>
    async params => {
        const result = await deps.ensureWalletSuiteSyncOn(params);

        if (result.success) {
            return;
        }

        // In uncontrolled context we do not want to handle this.
        // Normally this would show modal to the user, but this is not
        // desirable in uncontrolled context.
        //
        // This situation is handled declaratively for the user
        // (Banner or other declarative component).
        //
        if (
            result.error.type === 'SuiteSyncUnavailableOnDeviceError' ||
            result.error.type === 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType'
        ) {
            return;
        }

        const device = deps.getDeviceForStaticSessionId(params.deviceStaticSessionId);

        deps.suiteSyncUncontrolledErrorHandler({
            error: result.error,
            device: device && isTrezorDeviceWithState(device) ? device : null,
        });
    };
