import { Dispatch } from '@reduxjs/toolkit';

import { CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import { TrezorDevice } from '@suite-common/suite-types';
import { EnsureDelegatedIdentityKeyDep } from '@suite-common/wallet-core/src/device/delegatedIdentityKey/ensureDelegatedIdentityKey';
import { ProofOfDelegatedSignFailed } from '@suite-common/wallet-core/src/device/delegatedIdentityKey/getProofOfDelegatedIdentity';
import { DeviceCancelledErr, DeviceError } from '@suite-common/wallet-core/src/device/deviceUtils';
import { Result } from '@trezor/type-utils';

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
