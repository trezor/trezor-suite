import { CreateSuiteSyncOwner, CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import {
    DelegatedIdentityKey,
    SuiteSyncOwner,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import {
    DeviceCancelledErr,
    DeviceError,
    ProofOfDelegatedSignFailed,
    getProofOfDelegatedIdentity,
    isCanceledErrorMessage,
} from '@suite-common/wallet-core';
import {
    ProofOfDelegatedSignFailed,
    getProofOfDelegatedIdentity,
} from '@suite-common/wallet-core/src/device/delegatedIdentityKey/getProofOfDelegatedIdentity';
// Todo: move to device utils
import TrezorConnect from '@trezor/connect';
import { Result, err } from '@trezor/type-utils';

const PROOF_OF_DELEGATED_IDENTITY_HEADER = 'EvoluGetNode';

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

export const createEnsureSuiteSyncOwnerKeys =
    (deps: EnsureSuiteSyncOwnerDeps): EnsureSuiteSyncOwnerKeys =>
    async ({ device, delegatedKey }) => {
        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: PROOF_OF_DELEGATED_IDENTITY_HEADER,
        });

        // It may happen that we are not able to sign the ProofOfDelegatedIdentity.
        // It usually means bug/data corruption in the Redux.
        if (!proofOfDelegatedIdentity.ok) {
            return proofOfDelegatedIdentity;
        }

        const result = await deps.trezorConnect.evoluGetNode({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance ?? 0,
            },
            useEmptyPassphrase: device.useEmptyPassphrase ?? false,
            proof_of_delegated_identity: proofOfDelegatedIdentity.value,
        });

        if (result.success) {
            return deps.createSuiteSyncOwner({ data: result.payload.data });
        }

        if (isCanceledErrorMessage(result.payload.error)) {
            return err(DeviceCancelledErr());
        }

        return err(DeviceError(result.payload.error));
    };
