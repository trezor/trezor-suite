import type {
    NonceFailure,
    VerifiedBlock,
    VerifiedNonceChainId,
    VerifiedNonceEvidence,
    VerifierIdentity,
} from '@suite/desktop-app-api';

import { hexToBytes, parseHexQuantity } from './quantity';
import { type ProvenRead, type StepResult, fail } from './verifyProofBytes';

// `eth_getProof` rather than `eth_getCode` + `eth_getStorageAt`: one proof carries the code hash and
// the requested storage words under a single authenticated state root, so they describe the same
// block, and the code itself never has to be downloaded to be identified.
export const ACCOUNT_STATE_RPC_METHOD = 'eth_getProof';

// Small on purpose: every key is one more storage proof the prover has to produce and the user's
// interest in it leaves the machine.
export const MAX_STORAGE_KEYS = 4;

const STORAGE_KEY = /^0x[0-9a-f]{64}$/;
const WORD_HEX_LENGTH = 64;

export type VerifiedStorageWord = {
    key: string;
    // 32-byte, zero-padded, lowercase hex.
    value: string;
};

export type VerifiedAccountStateValue = {
    address: string;
    codeHash: string;
    storage: VerifiedStorageWord[];
};

export type AccountStateReadParams = {
    address: string;
    storageKeys: readonly string[];
};

export const isStorageKey = (value: unknown): value is string =>
    typeof value === 'string' && STORAGE_KEY.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isHash = (value: unknown): value is string => hexToBytes(value)?.length === 32;

const toStorageWord = (value: unknown): string | null => {
    const parsed = parseHexQuantity(value);
    if (!parsed.success) return null;

    return `0x${parsed.value.toString(16).padStart(WORD_HEX_LENGTH, '0')}`;
};

type ParseAccountStateParams = AccountStateReadParams & { result: unknown };

/**
 * Reads the verified `eth_getProof` result. Colibri has already checked the account and storage
 * proofs against the authenticated state root; this only refuses a result that does not answer
 * exactly the question that was asked (other account, other keys, other order).
 */
export const parseAccountStateResult = ({
    result,
    address,
    storageKeys,
}: ParseAccountStateParams): StepResult<VerifiedAccountStateValue> => {
    if (!isRecord(result) || typeof result.address !== 'string') {
        return fail('VERIFICATION_FAILED', 'account state result is not an object');
    }
    if (result.address.toLowerCase() !== address.toLowerCase()) {
        return fail('VERIFICATION_FAILED', 'account state for another address');
    }
    if (!isHash(result.codeHash)) {
        return fail('VERIFICATION_FAILED', 'account state without a code hash');
    }
    const { storageProof } = result;
    if (!Array.isArray(storageProof) || storageProof.length !== storageKeys.length) {
        return fail('VERIFICATION_FAILED', 'storage proofs do not match the requested keys');
    }

    const storage: VerifiedStorageWord[] = [];
    for (const [index, entry] of storageProof.entries()) {
        if (!isRecord(entry) || typeof entry.key !== 'string') {
            return fail('VERIFICATION_FAILED', 'storage proof without a key');
        }
        const key = entry.key.toLowerCase();
        if (key !== storageKeys[index]) {
            return fail('VERIFICATION_FAILED', 'storage proof for another key');
        }
        const value = toStorageWord(entry.value);
        if (value === null) return fail('VERIFICATION_FAILED', 'storage value is not a word');
        storage.push({ key, value });
    }

    return {
        success: true,
        value: { address: address.toLowerCase(), codeHash: result.codeHash.toLowerCase(), storage },
    };
};

export const accountStateRequestArgs = ({ address, storageKeys }: AccountStateReadParams) =>
    JSON.stringify([address.toLowerCase(), storageKeys, 'latest']);

export const createAccountStateRead = ({
    address,
    storageKeys,
}: AccountStateReadParams): ProvenRead<VerifiedAccountStateValue> => ({
    method: ACCOUNT_STATE_RPC_METHOD,
    argsJson: accountStateRequestArgs({ address, storageKeys }),
    address,
    parseResult: result => parseAccountStateResult({ result, address, storageKeys }),
});

export type VerifiedAccountState = {
    status: 'verified';
    requestId: string;
    chainId: VerifiedNonceChainId;
    address: string;
    codeHash: string;
    storage: VerifiedStorageWord[];
    block: VerifiedBlock;
    verifiedAtMs: number;
    expiresAtMs: number;
    verifier: VerifierIdentity;
    evidence: VerifiedNonceEvidence;
};

export type VerifiedAccountStateResult = VerifiedAccountState | NonceFailure;
