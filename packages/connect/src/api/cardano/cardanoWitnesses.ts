// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoWitnesses.js

import type { CertificateWithPoolOwnersAndRelays } from './cardanoCertificate';
import type { CollateralInputWithPath, InputWithPath, Path } from './cardanoInputs';
import { PROTO } from '../../constants';

export const gatherWitnessPaths = (
    inputsWithPath: InputWithPath[],
    certificatesWithPoolOwnersAndRelays: CertificateWithPoolOwnersAndRelays[],
    withdrawals: PROTO.CardanoTxWithdrawal[],
    collateralInputsWithPath: CollateralInputWithPath[],
    requiredSigners: PROTO.CardanoTxRequiredSigner[],
    additionalWitnessRequests: Path[],
    signingMode: PROTO.CardanoTxSigningMode,
): Path[] => {
    const witnessPaths = new Map<string, Path>();
    function _insert(path: Path) {
        const pathKey = JSON.stringify(path);
        witnessPaths.set(pathKey, path);
    }

    // don't gather paths from tx elements in MULTISIG_TRANSACTION signing mode
    if (signingMode !== PROTO.CardanoTxSigningMode.MULTISIG_TRANSACTION) {
        inputsWithPath.forEach(({ path }) => {
            if (path) _insert(path);
        });

        certificatesWithPoolOwnersAndRelays.forEach(({ certificate, poolOwners }) => {
            if (
                certificate.path &&
                (certificate.type === PROTO.CardanoCertificateType.STAKE_DELEGATION ||
                    certificate.type === PROTO.CardanoCertificateType.STAKE_DEREGISTRATION)
            ) {
                _insert(certificate.path);
            }
            poolOwners.forEach(poolOwner => {
                if (poolOwner.staking_key_path) _insert(poolOwner.staking_key_path);
            });
        });

        withdrawals.forEach(({ path }) => {
            if (path) _insert(path);
        });
    }

    // gather Plutus-related paths
    if (signingMode === PROTO.CardanoTxSigningMode.PLUTUS_TRANSACTION) {
        collateralInputsWithPath.forEach(({ path }) => {
            if (path) _insert(path);
        });

        requiredSigners.forEach(({ key_path }) => {
            if (key_path) _insert(key_path);
        });
    }

    // add additional witness requests in all cases (because of minting)
    additionalWitnessRequests.forEach(path => {
        _insert(path);
    });

    return Array.from(witnessPaths.values());
};
