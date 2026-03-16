import { type Dispatch } from '@reduxjs/toolkit';

import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { isTrezorDeviceWithState } from '@suite-common/device';
import {
    type EnsureSuiteSyncOwnerDep,
    type RefreshSuiteSyncKeys,
    type SuiteSyncUnavailableOnDeviceErrorType,
} from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { err, exhaustive, ok } from '@trezor/type-utils';

import { type GetDeviceForStaticSessionIdDep } from './getDeviceForStaticSessionId';

/**
 * Device is not connected or device is in a state/configuration, that does not
 * support Suite Sync.
 */
export const SuiteSyncUnavailableOnDeviceError = (): SuiteSyncUnavailableOnDeviceErrorType => ({
    type: 'SuiteSyncUnavailableOnDeviceError',
});

export type RefreshSuiteSyncKeysDeps = {
    dispatch: Dispatch;
} & EnsureSuiteSyncOwnerDep &
    EnsureDelegatedIdentityKeyDep &
    GetDeviceForStaticSessionIdDep;

export const createRefreshSuiteSync =
    (deps: RefreshSuiteSyncKeysDeps): RefreshSuiteSyncKeys =>
    async ({ device }): ReturnType<RefreshSuiteSyncKeys> => {
        if (!device || !isTrezorDeviceWithState(device)) {
            return err(SuiteSyncUnavailableOnDeviceError());
        }

        const deviceStaticId = device.state.staticSessionId;

        const getDelegatedIdentityKeys = async () => {
            const delegatedKeyResult = await deps.ensureDelegatedIdentityKey({ device });

            if (!delegatedKeyResult.success) {
                return delegatedKeyResult;
            }

            // Device's sessionId may have changed, so let's get the current one
            const refreshedDevice = deps.getDeviceForStaticSessionId(deviceStaticId);
            if (!refreshedDevice || !isTrezorDeviceWithState(refreshedDevice)) {
                // This shall not happen, if it does, it's probably a Suite/Connect bug.
                return err({ type: 'RefreshDeviceFailed' as const });
            }

            const ownerResult = await deps.ensureSuiteSyncOwner({
                device: refreshedDevice,
                delegatedKey: delegatedKeyResult.payload,
            });

            if (!ownerResult.success) {
                return ownerResult;
            }

            return ok({ owner: ownerResult.payload, delegatedKey: delegatedKeyResult.payload });
        };

        const result = await getDelegatedIdentityKeys();

        if (!result.success) {
            const errType = result.error.type;

            switch (errType) {
                case 'DeviceError':
                case 'DeviceCancelled':
                    return err(result.error);

                // Those errors are most likely due to Bug in the code or data corruption
                case 'CreateSuiteSyncOwnerError':
                case 'ProofOfDelegatedSignFailed':
                case 'RefreshDeviceFailed':
                    console.error(result.error);
                    // Todo: dispatch better notification
                    deps.dispatch(notificationsActions.addToast({ type: 'suite-sync-keys-error' }));

                    return err(SuiteSyncUnavailableOnDeviceError());
                default:
                    return exhaustive(errType);
            }
        }

        return ok(result.payload);
    };
