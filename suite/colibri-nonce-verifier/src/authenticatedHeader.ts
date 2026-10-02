import { keccak_256 } from '@noble/hashes/sha3.js';

import { bytesToBigint, bytesToHex, hexToBytes } from './quantity';
import { decodeRlpList } from './rlp';

export type AuthenticatedHeader = {
    blockHash: string;
    blockNumber: bigint;
    timestampSeconds: bigint;
    stateRoot: string;
    parentHash: string;
};

export type ExtractHeaderResult =
    | { success: true; header: AuthenticatedHeader }
    | { success: false; code: 'METADATA_UNAVAILABLE' | 'VERIFICATION_FAILED'; detail: string };

// Positions inside the RLP execution-layer header (parentHash, sha3Uncles, miner, stateRoot, ...).
const PARENT_HASH_INDEX = 0;
const STATE_ROOT_INDEX = 3;
const BLOCK_NUMBER_INDEX = 8;
const TIMESTAMP_INDEX = 11;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads block metadata out of the decoded form of the exact proof bytes that just verified.
 *
 * The verifier authenticates `elProof.clProof.elHeader` as a whole (keccak → beacon body root →
 * sync-committee signature) and takes the state root, number and timestamp from those same RLP
 * bytes, so re-parsing them here yields exactly the authenticated fields. The `blockHash` union
 * variant only references a header the verifier cached in an earlier operation; that header is
 * not part of these bytes, so metadata is reported as unavailable instead of being trusted.
 */
export const extractAuthenticatedHeader = (
    decodedProof: unknown,
    expectedAddress: string,
): ExtractHeaderResult => {
    if (!isRecord(decodedProof) || !isRecord(decodedProof.proof)) {
        return { success: false, code: 'VERIFICATION_FAILED', detail: 'undecodable proof' };
    }
    const { proof } = decodedProof;
    if (
        typeof proof.address !== 'string' ||
        proof.address.toLowerCase() !== expectedAddress.toLowerCase()
    ) {
        return { success: false, code: 'VERIFICATION_FAILED', detail: 'address mismatch' };
    }

    const { elProof } = proof;
    if (typeof elProof === 'string') {
        return { success: false, code: 'METADATA_UNAVAILABLE', detail: 'cached header reference' };
    }
    if (
        !isRecord(elProof) ||
        typeof elProof.elHeader !== 'string' ||
        !isRecord(elProof.clHeader) ||
        !Array.isArray(elProof.blockhashBranch)
    ) {
        return { success: false, code: 'METADATA_UNAVAILABLE', detail: 'unsupported elProof' };
    }

    const headerBytes = hexToBytes(elProof.elHeader);
    if (!headerBytes) {
        return { success: false, code: 'METADATA_UNAVAILABLE', detail: 'elHeader not hex' };
    }
    const decoded = decodeRlpList(headerBytes);
    if (!decoded.success) {
        return { success: false, code: 'METADATA_UNAVAILABLE', detail: decoded.error };
    }
    const parentHash = decoded.items[PARENT_HASH_INDEX];
    const stateRoot = decoded.items[STATE_ROOT_INDEX];
    const blockNumber = decoded.items[BLOCK_NUMBER_INDEX];
    const timestamp = decoded.items[TIMESTAMP_INDEX];
    if (
        !(parentHash instanceof Uint8Array) ||
        parentHash.length !== 32 ||
        !(stateRoot instanceof Uint8Array) ||
        stateRoot.length !== 32 ||
        !(blockNumber instanceof Uint8Array) ||
        blockNumber.length > 8 ||
        !(timestamp instanceof Uint8Array) ||
        timestamp.length > 8
    ) {
        return { success: false, code: 'METADATA_UNAVAILABLE', detail: 'unexpected header layout' };
    }

    return {
        success: true,
        header: {
            blockHash: bytesToHex(keccak_256(headerBytes)),
            blockNumber: bytesToBigint(blockNumber),
            timestampSeconds: bytesToBigint(timestamp),
            stateRoot: bytesToHex(stateRoot),
            parentHash: bytesToHex(parentHash),
        },
    };
};
