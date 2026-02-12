import { Dispatch } from '@reduxjs/toolkit';

import {
    WriteModeRequiredForAllocation,
    ensureDeviceHasQuotaThunk,
    ensureOwnerHasAllocatedQuotaThunk,
} from '@suite-common/suite-sync-quota-manager';
import type { WriteModeRequiredForAllocationErrType } from '@suite-common/suite-sync-types';
import { DelegatedIdentityKey, SuiteSyncOwner } from '@suite-common/suite-types';
import { isTrezorDeviceWithState, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';

import { GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';
import { GetDeviceHasAllowance } from '../getDeviceHasAllowance';

export type EnsureQuotaDeps = {
    dispatch: Dispatch;
    hasAllowance: GetDeviceHasAllowance;
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

        if (
            device?.id !== null &&
            device?.id !== undefined &&
            deps.hasAllowance({ walletDescriptor, deviceId: device.id })
        ) {
            return ok(undefined);
        }

        if (device !== null && isTrezorDeviceWithState(device)) {
            await deps.dispatch(
                ensureDeviceHasQuotaThunk({
                    device,
                    delegatedKey,
                }),
            );
        }

        const allocatedQuota = await deps.dispatch(
            ensureOwnerHasAllocatedQuotaThunk({
                walletDescriptor,
                ownerId: owner.ownerId,
                delegatedKey,
                isWriteMode,
            }),
        );

        if (
            allocatedQuota.success === false &&
            allocatedQuota.error.type === 'WriteModeRequiredForAllocation'
        ) {
            return err(WriteModeRequiredForAllocation());
        }

        return ok(undefined);
    };
