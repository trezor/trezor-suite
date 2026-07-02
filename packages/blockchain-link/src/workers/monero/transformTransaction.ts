// Map a monero-ts wallet transaction to the Suite Transaction shape (the recv / sent / self taxonomy,
// amount, targets, fee, vin). Pure and framework-free — it imports only the monero-ts *type* (no WASM
// runtime), so the worker can call it over wallet.getTxs() results and it stays unit-testable with
// plain mock tx objects. See ./__tests__/transformTransaction.test.ts.
import type { MoneroTxWallet } from 'monero-ts';

import type { Transaction } from '@trezor/blockchain-link-types';

export const transformTransaction = (tx: MoneroTxWallet, descriptor: string): Transaction => {
    const isIncoming = tx.getIsIncoming();
    const isOutgoing = tx.getIsOutgoing();

    // monero-ts getters are not strict-null typed; guard the unconfirmed (no block) case, the optional
    // outgoing transfer (its destinations are only known for txs the wallet itself built), and the
    // wallet's own inputs/outputs in this tx (used for self-send detection below).
    const anyTx = tx as unknown as {
        getFee?: () => bigint | undefined;
        getBlock?: () => { getTimestamp?: () => number } | undefined;
        getWeight?: () => number | undefined;
        getSize?: () => number | undefined;
        getInputsWallet?: () => { getAmount?: () => bigint | undefined }[] | undefined;
        getOutputsWallet?: () => { getAmount?: () => bigint | undefined }[] | undefined;
        getOutgoingTransfer?: () =>
            | {
                  getDestinations?: () => { getAddress?: () => string; getAmount?: () => bigint }[];
              }
            | undefined;
    };
    const fee = anyTx.getFee?.() ?? 0n;
    const incoming = isIncoming ? tx.getIncomingAmount() : 0n;
    const outgoing = isOutgoing ? tx.getOutgoingAmount() : 0n;

    // Total the wallet spent (own inputs) and got back (own outputs: change + any self-destinations).
    // monero-ts getInputsWallet()/getOutputsWallet() iterate getInputs()/getOutputs(), which are
    // undefined (and throw "not iterable") for a tx with no wallet inputs/outputs — a recv tx (no
    // inputs) or a sweep (no change). Guard so such a tx defaults to 0 (just not flagged as a
    // self-send) instead of throwing and taking the whole history transform down with it.
    const sumAmounts = (outputs?: { getAmount?: () => bigint | undefined }[]) =>
        (outputs ?? []).reduce((sum, output) => sum + (output.getAmount?.() ?? 0n), 0n);
    let ownInputs = 0n;
    let ownOutputs = 0n;
    try {
        ownInputs = sumAmounts(anyTx.getInputsWallet?.());
        ownOutputs = sumAmounts(anyTx.getOutputsWallet?.());
    } catch {
        // recv tx / sweep with no wallet inputs or outputs — leave both at 0n.
    }

    // A view-only wallet learns a spend via import_key_images, which carries no destinations, so
    // wallet2 folds a self-send's returned outputs into "change" and reports it as outgoing-only
    // (isIncoming === false) — it cannot prove the send went to the wallet itself. Recover it: if an
    // outgoing tx's own inputs equal its own outputs plus the fee, nothing left to an external address,
    // so it is a self-send (also covers churn). When the wallet surfaces both sides directly
    // (isIncoming && isOutgoing) we trust that. The `ownInputs > 0n` guard keeps a tx whose inputs
    // aren't populated as 'sent' rather than risking a mislabel; the equality is exact (no recipient
    // gets a non-zero amount only when the net sent is zero).
    let type: 'self' | 'sent' | 'recv';
    if (isIncoming && isOutgoing) {
        type = 'self';
    } else if (isOutgoing) {
        type = ownInputs > 0n && ownInputs === ownOutputs + fee ? 'self' : 'sent';
    } else {
        type = 'recv';
    }

    // The real recipients, if the wallet built this tx (empty for spends learned only via import).
    const destinations = (anyTx.getOutgoingTransfer?.()?.getDestinations?.() ?? [])
        .map(d => ({ address: d.getAddress?.() ?? '', amount: d.getAmount?.() ?? 0n }))
        .filter(d => d.address && d.address !== descriptor);

    let amount: bigint;
    let targets: Transaction['targets'];
    if (type === 'recv') {
        amount = incoming;
        targets = [{ n: 0, addresses: [descriptor], isAddress: true, amount: amount.toString() }];
    } else if (type === 'self') {
        // Funds only move to the wallet itself; the fee is all that actually leaves. Show the amount
        // that returned to the wallet — the incoming total when the wallet surfaces it, otherwise the
        // own-outputs total (a self-send detected only via the import accounting has incoming folded
        // into change, so incoming is 0 there).
        amount = fee;
        const returned = incoming > 0n ? incoming : ownOutputs;
        targets = [{ n: 0, addresses: [descriptor], isAddress: true, amount: returned.toString() }];
    } else if (destinations.length) {
        // sent: the real recipients are known (the wallet built this tx).
        amount = destinations.reduce((sum, d) => sum + d.amount, 0n);
        targets = destinations.map((d, n) => ({
            n,
            addresses: [d.address],
            isAddress: true,
            amount: d.amount.toString(),
        }));
    } else {
        // sent, recipients unknown (spend learned only via import): fall back to the accounting
        // identity outgoing - change(incoming) - fee for the amount that left the wallet.
        amount = outgoing > incoming + fee ? outgoing - incoming - fee : outgoing;
        targets = [{ n: 0, addresses: [], isAddress: true, amount: amount.toString() }];
    }

    const block = anyTx.getBlock?.();
    const blockTime = block?.getTimestamp?.();
    const blockHeight = block ? tx.getHeight() : undefined;
    // Used by Suite's fee-rate calc (fee / size); avoid a zero that would divide by zero.
    const size = anyTx.getWeight?.() ?? anyTx.getSize?.() ?? 0;
    // Flag an own input on spends so Suite counts the fee in balance/graph math (isTxFeePaid).
    const vin =
        type === 'recv'
            ? []
            : [
                  {
                      n: 0,
                      addresses: [descriptor],
                      isAddress: true,
                      isOwn: true,
                      value: outgoing.toString(),
                  },
              ];

    return {
        type,
        txid: tx.getHash(),
        blockHeight,
        blockTime,
        amount: amount.toString(),
        fee: fee.toString(),
        targets,
        tokens: [],
        internalTransfers: [],
        details: { vin, vout: [], size: size > 0 ? size : 1, totalInput: '0', totalOutput: '0' },
    };
};
