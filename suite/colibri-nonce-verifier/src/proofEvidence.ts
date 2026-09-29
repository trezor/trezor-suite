import { hexToBytes, parseHexQuantity } from './quantity';

export type ConsensusHeaderProof = 'signature' | 'headerChain' | 'historic';

export type ConsensusEvidence = {
    slot: bigint;
    signedSlot: bigint;
    headerProof: ConsensusHeaderProof;
    syncCommitteeParticipants: number;
    syncCommitteePeriod: bigint;
    proofFormatVersion: string;
};

export type ExtractConsensusResult =
    { success: true; consensus: ConsensusEvidence } | { success: false; detail: string };

const SYNC_COMMITTEE_SIZE = 512;
const SLOTS_PER_PERIOD = 8192n;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const readSlot = (header: unknown): bigint | null => {
    if (!isRecord(header)) return null;
    const slot = parseHexQuantity(header.slot);

    return slot.success ? slot.value : null;
};

const countBits = (bytes: Uint8Array): number => {
    let count = 0;
    for (const byte of bytes) {
        let remaining = byte;
        while (remaining) {
            remaining &= remaining - 1;
            count += 1;
        }
    }

    return count;
};

/**
 * Reads the consensus-layer facts out of the decoded form of a verified proof: which beacon slot
 * carried the execution block, which slot's header the sync committee actually signed (the same
 * one for a direct signature, a later one for a header chain or a historic-summary proof), and how
 * many of the 512 committee members signed. All of it is checkable on any beacon node or explorer.
 */
export const extractConsensusEvidence = (decodedProof: unknown): ExtractConsensusResult => {
    if (!isRecord(decodedProof) || !isRecord(decodedProof.proof)) {
        return { success: false, detail: 'undecodable proof' };
    }
    const { elProof } = decodedProof.proof;
    if (!isRecord(elProof) || !isRecord(elProof.clHeaderProof)) {
        return { success: false, detail: 'no consensus-layer header proof' };
    }
    const slot = readSlot(elProof.clHeader);
    if (slot === null) return { success: false, detail: 'beacon header without slot' };

    const { clHeaderProof } = elProof;
    let headerProof: ConsensusHeaderProof = 'signature';
    let signedSlot = slot;
    if (Array.isArray(clHeaderProof.headers)) {
        headerProof = 'headerChain';
    } else if ('gindex' in clHeaderProof && 'proof' in clHeaderProof) {
        headerProof = 'historic';
    }
    if (headerProof !== 'signature') {
        const signed = readSlot(clHeaderProof.header);
        if (signed === null) return { success: false, detail: 'signed header without slot' };
        signedSlot = signed;
    }

    const bits = hexToBytes(clHeaderProof.sync_committee_bits);
    if (bits?.length !== SYNC_COMMITTEE_SIZE / 8) {
        return { success: false, detail: 'malformed sync committee bits' };
    }

    return {
        success: true,
        consensus: {
            slot,
            signedSlot,
            headerProof,
            syncCommitteeParticipants: countBits(bits),
            syncCommitteePeriod: signedSlot / SLOTS_PER_PERIOD,
            proofFormatVersion:
                typeof decodedProof.version === 'string' ? decodedProof.version : 'unknown',
        },
    };
};
