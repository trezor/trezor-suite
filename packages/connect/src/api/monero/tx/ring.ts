// Ring (decoy + real input) assembly for a transaction source entry.
//
// Monero requires a source entry's `outputs` (the ring) to be sorted ascending by global output
// index — the final input's `key_offsets` are stored as relative deltas, which only works for a
// monotonically increasing sequence. `real_output` is the position of the genuinely-spent output
// within that sorted ring. (This mirrors wallet2's std::sort over src.outputs.)
import { bytesToHex } from './hex';

export interface RingOutput {
    /** Global RCT output index (the on-chain index returned by get_outs / the wallet). */
    globalIndex: number;
    /** One-time output public key (32 bytes). */
    dest: Uint8Array;
    /** Amount commitment (32 bytes). */
    commitment: Uint8Array;
}

/** Ring member in the shape moneroSignTransaction expects (MoneroOutputEntry). */
export interface RingMemberEntry {
    idx: number;
    key: { dest: string; commitment: string };
}

export interface AssembledRing {
    outputs: RingMemberEntry[];
    realOutput: number;
}

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

export const buildRing = (real: RingOutput, decoys: RingOutput[]): AssembledRing => {
    const members = [real, ...decoys].sort((a, b) => a.globalIndex - b.globalIndex);

    const realOutput = members.findIndex(
        member => member.globalIndex === real.globalIndex && bytesEqual(member.dest, real.dest),
    );
    if (realOutput === -1) {
        throw new Error('buildRing: real output not found in assembled ring');
    }

    // Reject duplicate global indices — a ring must reference distinct outputs.
    for (let i = 1; i < members.length; i++) {
        if (members[i]!.globalIndex === members[i - 1]!.globalIndex) {
            throw new Error('buildRing: duplicate output index in ring');
        }
    }

    return {
        realOutput,
        outputs: members.map(member => ({
            idx: member.globalIndex,
            key: { dest: bytesToHex(member.dest), commitment: bytesToHex(member.commitment) },
        })),
    };
};

/** Absolute global indices -> relative (delta) key_offsets, as stored in TxinToKey. */
export const toRelativeOffsets = (indices: number[]): number[] =>
    indices.map((index, i) => (i === 0 ? index : index - indices[i - 1]!));

/** Inverse of toRelativeOffsets. */
export const toAbsoluteOffsets = (offsets: number[]): number[] => {
    let acc = 0;

    return offsets.map(offset => {
        acc += offset;

        return acc;
    });
};
