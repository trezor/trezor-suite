import { ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import {
    DelegatedIdentityKey,
    SuiteSyncOwner,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import type { DeviceErrorType } from '@suite-common/wallet-types';
import { Result } from '@trezor/type-utils';

export type EnsureSuiteSyncOwnerParams = {
    device: Pick<TrezorDeviceWithState, 'useEmptyPassphrase' | 'path' | 'state' | 'instance'>;
    delegatedKey: DelegatedIdentityKey;
};

export type EnsureSuiteSyncOwner = (
    params: EnsureSuiteSyncOwnerParams,
) => Promise<
    Result<
        SuiteSyncOwner,
        DeviceErrorType | ProofOfDelegatedSignFailedType | CreateSuiteSyncOwnerError
    >
>;

export type EnsureSuiteSyncOwnerDep = {
    ensureSuiteSyncOwner: EnsureSuiteSyncOwner;
};
