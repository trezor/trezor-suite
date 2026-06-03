import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { DeviceError, isTrezorDeviceWithState } from '@suite-common/device';
import { type AllocateOwnerQuotaDep } from '@suite-common/suite-sync-quota-manager';
import { type Errors, type SuiteSyncInternalErrorHandler } from '@suite-common/suite-sync-types';
import { type TrezorDevice, asDelegatedIdentityKey } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { type SuiteSyncUncontrolledErrorHandlerDep } from './suiteSyncUncontrolledErrorHandler';

type GetSelectedDevice = () => TrezorDevice | undefined;

export type CreateSuiteSyncInternalErrorHandlerDeps = AllocateOwnerQuotaDep &
    EnsureDelegatedIdentityKeyDep &
    SuiteSyncUncontrolledErrorHandlerDep &
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
            deps.suiteSyncUncontrolledErrorHandler({
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
                    deps.suiteSyncUncontrolledErrorHandler({ error: delegatedKey.error, device });

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
                    deps.suiteSyncUncontrolledErrorHandler({ error: result.error, device });
                }

                return;
            }

            case 'RelayOther':
                deps.suiteSyncUncontrolledErrorHandler({ error, device });

                return;

            default:
                return exhaustive(type);
        }
    };
