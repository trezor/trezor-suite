import { CreateSuiteSyncOwner, CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import {
    DelegatedIdentityKey,
    SuiteSyncOwner,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { ProofOfDelegatedSignFailed } from '@suite-common/wallet-core/src/device/delegatedIdentityKey/getProofOfDelegatedIdentity';
import { DeviceCancelledErr, DeviceError } from '@suite-common/wallet-core/src/device/deviceUtils';
import TrezorConnect from '@trezor/connect';
import { Result } from '@trezor/type-utils';

export type EnsureSuiteSyncOwnerDeps = {
    createSuiteSyncOwner: CreateSuiteSyncOwner;
    trezorConnect: Pick<typeof TrezorConnect, 'evoluGetNode'>;
};

export type EnsureSuiteSyncOwnerKeysParams = {
    device: Pick<TrezorDeviceWithState, 'useEmptyPassphrase' | 'path' | 'state' | 'instance'>;
    delegatedKey: DelegatedIdentityKey;
};

export type EnsureSuiteSyncOwnerKeys = (
    params: EnsureSuiteSyncOwnerKeysParams,
) => Promise<
    Result<
        SuiteSyncOwner,
        DeviceCancelledErr | DeviceError | ProofOfDelegatedSignFailed | CreateSuiteSyncOwnerError
    >
>;

export type EnsureSuiteSyncOwnerDep = {
    ensureSuiteSyncOwnerKeys: EnsureSuiteSyncOwnerKeys;
};
