import { type Dispatch } from '@reduxjs/toolkit';

import { isTrezorDeviceWithState } from '@suite-common/device';
import { type SuiteSyncOwner } from '@suite-common/suite-sync-storage';
import { type WriteModeRequiredForAllocationErrType } from '@suite-common/suite-sync-types';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';
import { isNotNull, isNotNullOrUndefined } from '@trezor/utils';

import { ensureDeviceHasQuotaThunk } from './ensureDeviceHasQuotaThunk';
import {
    WriteModeRequiredForAllocation,
    ensureOwnerHasAllocatedQuotaThunk,
} from './ensureOwnerHasAllocatedQuotaThunk';
import { type GetDeviceForStaticSessionIdDep } from './getDeviceForStaticSessionId';
import { type GetDeviceHasAllowanceDep } from './getDeviceHasAllowance';

export type EnsureQuotaDeps = {
    dispatch: Dispatch;
} & GetDeviceForStaticSessionIdDep &
    GetDeviceHasAllowanceDep;

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

        if (deps.getDeviceHasAllowance(device.id, walletDescriptor)) {
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
                deviceStaticSessionId,
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
