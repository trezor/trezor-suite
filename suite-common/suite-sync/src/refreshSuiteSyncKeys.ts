import { Dispatch } from '@reduxjs/toolkit';

import { EncryptionUnavailable } from '@suite-common/secure-storage';
import { CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    DeviceCancelledErr,
    DeviceError,
    EnsureDelegatedIdentityKey,
    ProofOfDelegatedSignFailed,
    deviceActions,
    selectDevices,
} from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { Result, err, ok } from '@trezor/type-utils';

import { EnsureSuiteSyncOwnerKeys } from './device/ensureSuiteSyncOwnerKeys';

export type RefreshSuiteSyncKeysDeps = {
    getState: () => any;
    dispatch: Dispatch;
    ensureDelegatedIdentityKey: EnsureDelegatedIdentityKey;
    ensureSuiteSyncOwnerKeys: EnsureSuiteSyncOwnerKeys;
};

type RefreshSuiteSyncKeysParams = {
    device: TrezorDevice;
};

export type DeviceDoesNotSupportSuiteSyncErr = {
    type: 'DeviceDoesNotSupportSuiteSyncErr';
};

export const DeviceDoesNotSupportSuiteSyncErr = (): DeviceDoesNotSupportSuiteSyncErr => ({
    type: 'DeviceDoesNotSupportSuiteSyncErr',
});

export type RefreshSuiteSyncKeys = (
    params: RefreshSuiteSyncKeysParams,
) => Promise<
    Result<
        void,
        | DeviceError
        | DeviceCancelledErr
        | EncryptionUnavailable
        | DeviceDoesNotSupportSuiteSyncErr
        | ProofOfDelegatedSignFailed
        | CreateSuiteSyncOwnerError
    >
>;

export const createRefreshSuiteSyncKeys =
    (deps: RefreshSuiteSyncKeysDeps): RefreshSuiteSyncKeys =>
    async ({ device: originalDevice }) => {
        const device = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (device?.suiteSyncOwner !== undefined) {
            return ok();
        }

        if (
            device === undefined ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' || // bootloader,
            !isTrezorDeviceWithState(device)
        ) {
            return err(DeviceDoesNotSupportSuiteSyncErr());
        }

        const delegatedKeyResult = await deps.ensureDelegatedIdentityKey({
            device,
        });

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

        deps.dispatch(
            deviceActions.setSuiteSyncOwner({
                device,
                owner: evoluNodeResult.value ?? undefined,
            }),
        );

        return ok();
    };
