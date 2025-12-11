import { ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import {
    DelegatedIdentityKey,
    SuiteSyncOwner,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { Result } from '@trezor/type-utils';

export type EnsureSuiteSyncOwnerKeysParams = {
    device: Pick<TrezorDeviceWithState, 'useEmptyPassphrase' | 'path' | 'state' | 'instance'>;
    delegatedKey: DelegatedIdentityKey;
};

export type EnsureSuiteSyncOwnerKeys = (
    params: EnsureSuiteSyncOwnerKeysParams,
) => Promise<
    Result<
        SuiteSyncOwner,
        | DeviceCancelledErrType
        | DeviceErrorType
        | ProofOfDelegatedSignFailedType
        | CreateSuiteSyncOwnerError
    >
>;

export type EnsureSuiteSyncOwnerDep = {
    ensureSuiteSyncOwnerKeys: EnsureSuiteSyncOwnerKeys;
};
