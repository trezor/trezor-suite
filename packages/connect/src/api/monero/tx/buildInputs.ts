// Turns the wallet's raw spendable outputs into the `OwnedInput`s the compose step consumes: for each
// output it picks decoys (gamma) and fetches every ring member's on-chain key + commitment via the
// daemon's get_outs, so the real output is indistinguishable from its decoys.
//
// The data each spendable output carries (global index, the tx public key + in-tx index that created
// it, subaddress, amount, mask) comes from the scanning wallet; this module is pure assembly + daemon
// I/O, so it is unit-testable with a stub daemon and a fixed decoy selector.
import type { OwnedInput } from './buildTransaction';
import type { MoneroDaemonRpc } from './daemonRpc';
import type { RingOutput } from './ring';

export interface SpendableOutput {
    amount: number;
    /** Global RCT output index (decoy selection + get_outs reference). */
    globalIndex: number;
    /** Public key of the tx that created this output (tx_extra tag 0x01), hex. */
    realOutTxKey: string;
    realOutAdditionalTxKeys?: string[];
    /** Index of this output within its source transaction. */
    realOutputInTxIndex: number;
    /** Subaddress minor index the output was received on (0 for the main address). */
    subaddrMinor: number;
    /** Commitment blinding (mask) of the output, hex. May be empty if the device derives it. */
    mask: string;
}

/** Picks `count` decoy global indices for a real output (e.g. GammaPicker.selectDecoys). */
export type DecoySelector = (count: number, realIndex: number) => number[];

export const buildOwnedInputs = async (
    outputs: SpendableOutput[],
    daemon: Pick<MoneroDaemonRpc, 'getOuts'>,
    selectDecoys: DecoySelector,
    ringSize: number,
): Promise<OwnedInput[]> => {
    if (ringSize < 1) {
        throw new Error('buildOwnedInputs: ringSize must be at least 1');
    }

    return await Promise.all(
        outputs.map(async output => {
            const decoyIndices = selectDecoys(ringSize - 1, output.globalIndex);
            // The real output goes first so we can read it back at index 0; order within the ring is
            // decided later by buildRing (sorted ascending by global index).
            const ringIndices = [output.globalIndex, ...decoyIndices];

            // RingCT outputs are looked up with amount 0.
            const fetched = await daemon.getOuts(ringIndices.map(index => ({ amount: 0, index })));
            if (fetched.length !== ringIndices.length) {
                throw new Error(
                    `buildOwnedInputs: get_outs returned ${fetched.length} of ${ringIndices.length} ring members`,
                );
            }

            const toRingOutput = (globalIndex: number, position: number): RingOutput => ({
                globalIndex,
                dest: fetched[position]!.key,
                commitment: fetched[position]!.mask,
            });

            return {
                amount: output.amount,
                real: toRingOutput(output.globalIndex, 0),
                decoys: decoyIndices.map((index, i) => toRingOutput(index, i + 1)),
                mask: output.mask,
                realOutTxKey: output.realOutTxKey,
                realOutAdditionalTxKeys: output.realOutAdditionalTxKeys,
                realOutputInTxIndex: output.realOutputInTxIndex,
                subaddrMinor: output.subaddrMinor,
            } satisfies OwnedInput;
        }),
    );
};
