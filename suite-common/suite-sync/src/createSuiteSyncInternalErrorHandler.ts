import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { DeviceError, isTrezorDeviceWithState } from '@suite-common/device';
import {
    type AllocateOwnerQuotaDep,
    type AllocateOwnerQuotaErr,
} from '@suite-common/suite-sync-quota-manager';
import {
    type EnsureWalletSuiteSyncOnErrors,
    type Errors,
    type SuiteSyncInternalErrorHandler,
    type SuiteSyncOtherError,
} from '@suite-common/suite-sync-types';
import {
    type TrezorDevice,
    type TrezorDeviceWithState,
    asDelegatedIdentityKey,
} from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

/**
 * Those are all errors that may happen asynchronously during the SuiteSync lifecycle,
 * typically in response to some websocket message.
 */
export type SuiteSyncAsyncError =
    | AllocateOwnerQuotaErr
    | EnsureWalletSuiteSyncOnErrors
    | SuiteSyncOtherError;

/**
 * This is External error handler. The caller of the SuiteSync (Desktop, Web, Native, ...)
 * should provide this handler and handle those errors (or delegate to end-user).
 */
export type SuiteSyncAsyncErrorHandlerParams = {
    error: SuiteSyncAsyncError;
    device: TrezorDeviceWithState | null;
};

export type SuiteSyncAsyncErrorHandler = ({
    error,
    device,
}: SuiteSyncAsyncErrorHandlerParams) => void;

export type SuiteSyncAsyncErrorHandlerDep = {
    suiteSyncAsyncErrorHandler: SuiteSyncAsyncErrorHandler;
};

type GetSelectedDevice = () => TrezorDevice | undefined;

export type CreateSuiteSyncInternalErrorHandlerDeps = AllocateOwnerQuotaDep &
    EnsureDelegatedIdentityKeyDep &
    SuiteSyncAsyncErrorHandlerDep &
    // Todo: temporary, see: https://github.com/trezor/trezor-suite/issues/27049
    { getSelectedDevice: GetSelectedDevice };

/**
 * Responsibility of this service is to map errors from Storage to the SuiteSync
 * and QuotaManager.
 *
 * For example: When RelayQuotaExceeded it shall try to increase it, and map other
 *              errors and propagate them upstream.
 */
export const createSuiteSyncInternalErrorHandler =
    (deps: CreateSuiteSyncInternalErrorHandlerDeps): SuiteSyncInternalErrorHandler =>
    async (error: Errors) => {
        const { type } = error;

        // Todo: ------ this shall be REFACTORED OUT! [https://github.com/trezor/trezor-suite/issues/27049] ------
        const device = deps.getSelectedDevice();

        if (!device || !isTrezorDeviceWithState(device)) {
            // Temporary, no better error
            deps.suiteSyncAsyncErrorHandler({
                error: DeviceError('Device not found during handling SuiteSync internal error'),
                device: null,
            });

            return;
        }

        // Todo: ------ end of temporary code ------

        switch (type) {
            case 'RelayQuotaExceeded': {
                const delegatedKey = await deps.ensureDelegatedIdentityKey({ device });

                if (!delegatedKey.success) {
                    deps.suiteSyncAsyncErrorHandler({ error: delegatedKey.error, device });

                    return;
                }

                const { walletDescriptor } = parseDeviceStaticSessionId(
                    device.state.staticSessionId,
                );
                const result = await deps.allocateOwnerQuota({
                    ownerId: error.ownerId,
                    delegatedKey: asDelegatedIdentityKey(delegatedKey.payload),
                    deviceId: device.id,
                    walletDescriptor,
                    isWriteMode: true, // This happens during Evolu Sync, so it is always write-mode: true
                });

                if (!result.success) {
                    deps.suiteSyncAsyncErrorHandler({ error: result.error, device });
                }

                return;
            }

            case 'RelayOther':
                deps.suiteSyncAsyncErrorHandler({ error, device });

                return;

            default:
                return exhaustive(type);
        }
    };
