import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { ensureDeviceHasQuotaThunk } from '@suite-common/suite-sync-quota-manager';
import {
    EnsureSuiteSyncOwnerDep,
    RefreshSuiteKeysUnavailableType,
    RefreshSuiteSyncKeys,
} from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { err, exhaustive, ok } from '@trezor/type-utils';

import { GetDeviceForStaticSessionIdDep } from './getDeviceForStaticSessionId';
import { LoadSuiteSyncOwnerFromStateDep } from './owner/createLoadSuiteSyncOwnerFromState';

/**
 * Device is not connected or device is in a state/configuration, that does not
 * support Suite Sync.
 */
export const RefreshSuiteKeysUnavailable = (): RefreshSuiteKeysUnavailableType => ({
    type: 'RefreshSuiteKeysUnavailable',
});

export type RefreshSuiteSyncKeysDeps = {
    dispatch: Dispatch;
} & EnsureSuiteSyncOwnerDep &
    LoadSuiteSyncOwnerFromStateDep &
    EnsureDelegatedIdentityKeyDep &
    GetDeviceForStaticSessionIdDep;

export const createRefreshSuiteSync =
    (deps: RefreshSuiteSyncKeysDeps): RefreshSuiteSyncKeys =>
    async ({ device }): ReturnType<RefreshSuiteSyncKeys> => {
        if (!device || !isTrezorDeviceWithState(device)) {
            return err(RefreshSuiteKeysUnavailable());
        }

        const deviceStaticId = device.state.staticSessionId;

        const owner = await deps.loadSuiteSyncOwnerFromState({ deviceStaticId });

        if (owner !== null) {
            return ok(owner);
        }

        if (
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' // bootloader
        ) {
            return err(RefreshSuiteKeysUnavailable());
        }

        const getKeys = async () => {
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

            await deps.dispatch(
                ensureDeviceHasQuotaThunk({
                    device: refreshedDevice,
                    delegatedKey: delegatedKeyResult.payload,
                }),
            );

            const ownerResult = await deps.ensureSuiteSyncOwner({
                device: refreshedDevice,
                delegatedKey: delegatedKeyResult.payload,
            });

            if (!ownerResult.success) {
                return ownerResult;
            }

            return ok(ownerResult.payload);
        };

        const result = await getKeys();

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

                    return err(RefreshSuiteKeysUnavailable());
                default:
                    return exhaustive(errType);
            }
        }

        return ok(result.payload);
    };
