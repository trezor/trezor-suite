import type { ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import type { CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import type {
    DelegatedIdentityKey,
    SuiteSyncOwner,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import type { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import type { Result } from '@trezor/type-utils';

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
