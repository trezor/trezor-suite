import { getProofOfDelegatedIdentity } from '@suite-common/delegated-identity-key';
import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { DeviceError } from '@suite-common/device';
import {
    type CreateSuiteSyncOwner,
    type CreateSuiteSyncOwnerError,
    type SuiteSyncOwner,
} from '@suite-common/suite-sync-storage';
import {
    type DelegatedIdentityKey,
    type DeviceErrorType,
    type TrezorDeviceWithState,
} from '@suite-common/suite-types';
import type TrezorConnect from '@trezor/connect';
import { type Result, err } from '@trezor/type-utils';

const PROOF_OF_DELEGATED_IDENTITY_HEADER = 'EvoluGetNode';

export type RetrieveSuiteSyncOwnerParams = {
    device: Pick<TrezorDeviceWithState, 'useEmptyPassphrase' | 'path' | 'state' | 'instance'>;
    delegatedKey: DelegatedIdentityKey;
};

export type RetrieveSuiteSyncOwner = (
    params: RetrieveSuiteSyncOwnerParams,
) => Promise<
    Result<
        SuiteSyncOwner,
        DeviceErrorType | ProofOfDelegatedSignFailedType | CreateSuiteSyncOwnerError
    >
>;

export type RetrieveSuiteSyncOwnerKeysDep = {
    retrieveSuiteSyncOwner: RetrieveSuiteSyncOwner;
};

export type RetrieveSuiteSyncOwnerDeps = {
    createSuiteSyncOwner: CreateSuiteSyncOwner;
    trezorConnect: Pick<typeof TrezorConnect, 'evoluGetNode'>;
};

export const createRetrieveSuiteSyncOwner =
    (deps: RetrieveSuiteSyncOwnerDeps): RetrieveSuiteSyncOwner =>
    async ({ device, delegatedKey }) => {
        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: PROOF_OF_DELEGATED_IDENTITY_HEADER,
        });

        // It may happen that we are not able to sign the ProofOfDelegatedIdentity.
        // It usually means bug/data corruption in the Redux.
        if (!proofOfDelegatedIdentity.success) {
            return proofOfDelegatedIdentity;
        }

        const result = await deps.trezorConnect.evoluGetNode({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance ?? 0,
                useEmptyPassphrase: device.useEmptyPassphrase ?? false,
            },
            proof_of_delegated_identity: proofOfDelegatedIdentity.payload,
        });

        if (result.success) {
            return deps.createSuiteSyncOwner({ data: result.payload.data });
        }

        return err(DeviceError(result.error.message));
    };
