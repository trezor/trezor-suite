import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import {
    type CreateSuiteSyncOwnerError,
    type SuiteSyncOwner,
} from '@suite-common/suite-sync-storage';
import {
    type DelegatedIdentityKey,
    type DeviceErrorType,
    type DeviceNotConnectedErrorType,
    type TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { type LazyLoadingError } from '@trezor/lazy-loading';
import { type Result } from '@trezor/type-utils';

export type EnsureSuiteSyncOwnerParams = {
    device: Pick<
        TrezorDeviceWithState,
        'useEmptyPassphrase' | 'path' | 'state' | 'instance' | 'connected'
    >;
    delegatedKey: DelegatedIdentityKey;
};

export type EnsureSuiteSyncOwner = (
    params: EnsureSuiteSyncOwnerParams,
) => Promise<
    Result<
        SuiteSyncOwner,
        | DeviceErrorType
        | ProofOfDelegatedSignFailedType
        | CreateSuiteSyncOwnerError
        | LazyLoadingError
        | DeviceNotConnectedErrorType
    >
>;

export type EnsureSuiteSyncOwnerDep = {
    ensureSuiteSyncOwner: EnsureSuiteSyncOwner;
};
