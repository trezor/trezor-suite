// Locate a wallet output within the transaction that created it, and extract the tx public key(s)
// needed to spend it.
//
// Spending re-derives the output's shared secret from the transaction public key R (tx_extra tag
// 0x01) and the wallet's private view key. Subaddress transactions instead carry one additional
// public key per output (tag 0x04); the whole vector is passed through and the device picks the
// right one by `real_output_in_tx_index`. This is pure given the source tx's per-output one-time
// keys + extra blob, so it is unit-testable without a daemon.
import type { SourceTransaction } from './daemonRpc';
import { parseTxExtra } from './txExtra';

export interface ResolvedSourceOutput {
    /** Index of the output within its source transaction (real_output_in_tx_index). */
    realOutputInTxIndex: number;
    /** Transaction public key R (tag 0x01), hex. */
    realOutTxKey: string;
    /** Per-output additional tx public keys (tag 0x04), full vector; empty for non-subaddress txs. */
    realOutAdditionalTxKeys: string[];
}

export const resolveSourceOutput = (
    stealthPublicKey: string,
    tx: SourceTransaction,
): ResolvedSourceOutput => {
    const realOutputInTxIndex = tx.voutStealthKeys.indexOf(stealthPublicKey);
    if (realOutputInTxIndex < 0) {
        throw new Error(`resolveSourceOutput: output not found in source transaction ${tx.hash}`);
    }

    const { txPubKey, additionalTxPubKeys } = parseTxExtra(tx.extra);
    if (!txPubKey) {
        throw new Error(`resolveSourceOutput: source transaction ${tx.hash} has no tx public key`);
    }

    // A transaction either carries no additional keys, or exactly one per output. Any other count
    // means we cannot reliably pick the per-output key, so fail loudly rather than spend wrongly.
    if (
        additionalTxPubKeys.length > 0 &&
        additionalTxPubKeys.length !== tx.voutStealthKeys.length
    ) {
        throw new Error(
            `resolveSourceOutput: ${additionalTxPubKeys.length} additional tx keys for ${tx.voutStealthKeys.length} outputs in ${tx.hash}`,
        );
    }

    return {
        realOutputInTxIndex,
        realOutTxKey: txPubKey,
        realOutAdditionalTxKeys: additionalTxPubKeys,
    };
};
