import { EnsureSuiteSyncOwnerDeps, EnsureSuiteSyncOwnerKeys } from '@suite-common/suite-sync-types';
import { DeviceCancelledErr, DeviceError, isCanceledErrorMessage } from '@suite-common/wallet-core';
import { getProofOfDelegatedIdentity } from '@suite-common/wallet-utils';
import { err } from '@trezor/type-utils';

const PROOF_OF_DELEGATED_IDENTITY_HEADER = 'EvoluGetNode';

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
