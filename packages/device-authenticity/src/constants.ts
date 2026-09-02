import type { ProofType } from './types';
import type { AlgorithmName } from './x509certificate';

/**
 * Aligns with deviceAuthenticityConfig.ts, where rootPubKeys are separated per check type:
 * rootPubKeysOptiga | rootPubKeysTropic | rootPubKeysMLDSA.
 * Each of these contains only keys for the respective curve.
 */
export const EXPECTED_ALGORITHM_NAME_PER_PROOF_TYPE: Record<ProofType, AlgorithmName> = {
    optiga: 'P-256',
    tropic: 'Ed25519',
    mcu: 'MLDSA44',
};
