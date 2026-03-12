import { Dispatch } from '@reduxjs/toolkit';

import {
    WriteModeRequiredForAllocation,
    ensureDeviceHasQuotaThunk,
    ensureOwnerHasAllocatedQuotaThunk,
} from '@suite-common/suite-sync-quota-manager';
import { SuiteSyncOwner } from '@suite-common/suite-sync-storage';
import { WriteModeRequiredForAllocationErrType } from '@suite-common/suite-sync-types';
import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { isTrezorDeviceWithState, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';
import { isNotNull, isNotNullOrUndefined } from '@trezor/utils';

import { GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';
import { GetDeviceHasAllowance } from '../getDeviceHasAllowance';

export type EnsureQuotaDeps = {
    dispatch: Dispatch;
    hasAllowance: GetDeviceHasAllowance;
    getIsDefaultRelayUrlSet: () => boolean;
    getEnforceQuotaManager: () => boolean;
} & GetDeviceForStaticSessionIdDep;

export type EnsureQuotaParams = {
    deviceStaticSessionId: StaticSessionId;
    delegatedKey: DelegatedIdentityKey;
    owner: SuiteSyncOwner;
    isWriteMode: boolean;
};

export type EnsureQuota = (
    params: EnsureQuotaParams,
) => Promise<Result<void, WriteModeRequiredForAllocationErrType>>;

export type EnsureQuotaDep = {
    ensureQuota: EnsureQuota;
};

export const createEnsureQuota =
    (deps: EnsureQuotaDeps): EnsureQuota =>
    async ({ deviceStaticSessionId, delegatedKey, owner, isWriteMode }) => {
        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const device = deps.getDeviceForStaticSessionId(deviceStaticSessionId);

        if (device === null || !isNotNullOrUndefined(device.id)) {
            return ok();
        }

        // We only want to use QM for our own relay servers. In case custom URL has been set, QM is ignored,
        // unless enforceQuotaManager is set (used for e2e tests with a local relay).
        const isQuotaManagerEnabled =
            deps.getIsDefaultRelayUrlSet() || deps.getEnforceQuotaManager();

        if (
            deps.hasAllowance({ walletDescriptor, deviceId: device.id }) ||
            !isQuotaManagerEnabled
        ) {
            return ok();
        }

        if (isNotNull(device) && isTrezorDeviceWithState(device)) {
            await deps.dispatch(
                ensureDeviceHasQuotaThunk({
                    device,
                    delegatedKey,
                }),
            );
        }

        const allocatedQuota = await deps.dispatch(
            ensureOwnerHasAllocatedQuotaThunk({
                deviceSessionId: deviceStaticSessionId,
                ownerId: owner.ownerId,
                delegatedKey,
                isWriteMode,
            }),
        );

        if (
            !allocatedQuota.success &&
            allocatedQuota.error.type === 'WriteModeRequiredForAllocation'
        ) {
            return err(WriteModeRequiredForAllocation());
        }

        return ok();
    };
