import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { ensureDeviceHasQuotaThunk } from '@suite-common/suite-sync-quota-manager';
import {
    EnsureSuiteSyncOwnerDep,
    RefreshSuiteKeysUnavailable,
    RefreshSuiteSyncKeys,
} from '@suite-common/suite-sync-types';
import { deviceActions } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { err, ok } from '@trezor/type-utils';

export type RefreshSuiteSyncKeysDeps = {
    dispatch: Dispatch;
} & EnsureSuiteSyncOwnerDep &
    EnsureDelegatedIdentityKeyDep;

export const createRefreshSuiteSyncKeys =
    (deps: RefreshSuiteSyncKeysDeps): RefreshSuiteSyncKeys =>
    async ({ device }) => {
        if (device?.suiteSyncOwner !== undefined) {
            return ok();
        }

        if (
            device === undefined ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' || // bootloader,
            !isTrezorDeviceWithState(device)
        ) {
            return err(RefreshSuiteKeysUnavailable());
        }

        const delegatedKeyResult = await deps.ensureDelegatedIdentityKey({ device });

        if (!delegatedKeyResult.ok) {
            return delegatedKeyResult;
        }

        const evoluNodeResult = await deps.ensureSuiteSyncOwnerKeys({
            device,
            delegatedKey: delegatedKeyResult.value,
        });

        if (!evoluNodeResult.ok) {
            deps.dispatch(deviceActions.setSuiteSyncOwner({ device, owner: undefined }));
            deps.dispatch(
                deviceActions.setDelegatedIdentityKey({ deviceId: device.id, delegatedKey: null }),
            );

            return evoluNodeResult;
        }

        await deps.dispatch(
            ensureDeviceHasQuotaThunk({
                device,
                delegatedKey: delegatedKeyResult.value,
            }),
        );

        deps.dispatch(
            deviceActions.setSuiteSyncOwner({
                device,
                owner: evoluNodeResult.value ?? undefined,
            }),
        );

        return ok();
    };
