import { Dispatch } from '@reduxjs/toolkit';

import { CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import { TrezorDevice } from '@suite-common/suite-types';
import { EnsureDelegatedIdentityKeyDep } from '@suite-common/wallet-core/src/device/delegatedIdentityKey/ensureDelegatedIdentityKey';
import { ProofOfDelegatedSignFailed } from '@suite-common/wallet-core/src/device/delegatedIdentityKey/getProofOfDelegatedIdentity';
import { deviceActions } from '@suite-common/wallet-core/src/device/deviceActions';
import { selectDevices } from '@suite-common/wallet-core/src/device/deviceSelectors';
import { DeviceCancelledErr, DeviceError } from '@suite-common/wallet-core/src/device/deviceUtils';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { Result, err, ok } from '@trezor/type-utils';

import { EnsureSuiteSyncOwnerDep } from './device/ensureSuiteSyncOwnerKeys';

export type RefreshSuiteSyncKeysDeps = {
    getState: () => any;
    dispatch: Dispatch;
} & EnsureSuiteSyncOwnerDep &
    EnsureDelegatedIdentityKeyDep;

type RefreshSuiteSyncKeysParams = {
    device: TrezorDevice;
};

export type RefreshSuiteKeysUnavailable = {
    type: 'RefreshSuiteKeysUnavailable';
};

/**
 * Device is not connected or device is in a state/configuration, that does not
 * support Suite Sync.
 */
export const RefreshSuiteKeysUnavailable = (): RefreshSuiteKeysUnavailable => ({
    type: 'RefreshSuiteKeysUnavailable',
});

export type RefreshSuiteSyncKeys = (
    params: RefreshSuiteSyncKeysParams,
) => Promise<
    Result<
        void,
        | DeviceError
        | DeviceCancelledErr
        | RefreshSuiteKeysUnavailable
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

        deps.dispatch(
            deviceActions.setSuiteSyncOwner({
                device,
                owner: evoluNodeResult.value ?? undefined,
            }),
        );

        return ok();
    };
