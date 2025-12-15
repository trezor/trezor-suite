import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { ensureDeviceHasQuotaThunk } from '@suite-common/suite-sync-quota-manager';
import {
    EnsureSuiteSyncOwnerDep,
    RefreshSuiteKeysUnavailable,
    RefreshSuiteSyncKeys,
} from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { err, exhaustive, ok } from '@trezor/type-utils';

export type RefreshSuiteSyncKeysDeps = {
    dispatch: Dispatch;
} & EnsureSuiteSyncOwnerDep &
    EnsureDelegatedIdentityKeyDep;

export const createRefreshSuiteSync =
    (deps: RefreshSuiteSyncKeysDeps): RefreshSuiteSyncKeys =>
    async ({ device }): ReturnType<RefreshSuiteSyncKeys> => {
        if (
            device === undefined ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' || // bootloader,
            !isTrezorDeviceWithState(device)
        ) {
            return err(RefreshSuiteKeysUnavailable());
        }

        const getKeys = async () => {
            const delegatedKeyResult = await deps.ensureDelegatedIdentityKey({ device });

            if (!delegatedKeyResult.ok) {
                return delegatedKeyResult;
            }

            await deps.dispatch(
                ensureDeviceHasQuotaThunk({
                    device,
                    delegatedKey: delegatedKeyResult.value,
                }),
            );

            const ownerResult = await deps.ensureSuiteSyncOwner({
                device,
                delegatedKey: delegatedKeyResult.value,
            });

            if (!ownerResult.ok) {
                return ownerResult;
            }

            return ok(ownerResult.value);
        };

        const result = await getKeys();

        if (!result.ok) {
            const errType = result.error.type;

            switch (errType) {
                case 'DeviceError':
                case 'DeviceCancelled':
                    return err(result.error);

                // Those errors are most likely due to Bug in the code or data corruption
                case 'CreateSuiteSyncOwnerError':
                case 'ProofOfDelegatedSignFailed':
                    console.error(result.error);
                    // Todo: dispatch better notification
                    deps.dispatch(notificationsActions.addToast({ type: 'suite-sync-keys-error' }));

                    return err(RefreshSuiteKeysUnavailable());
                default:
                    return exhaustive(errType);
            }
        }

        return ok(result.value);
    };
