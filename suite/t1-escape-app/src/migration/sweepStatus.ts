import type { Transaction } from '@trezor/blockchain-link-types';

import type { AccountSnapshot } from './accountSnapshot';
import { isPendingTransaction } from './accountState';
import type { SignedSweepRecord } from './sweepLedger';
import type { Backend } from '../backend/backend';
import { getOutpointKey } from '../bitcoin/outpoint';

export type SweepStatus =
    /** A confirmed transaction spends the inputs and pays the destination the composed amount. */
    | 'confirmed'
    /** The transfer is in the mempool. The device must not be updated or wiped yet. */
    | 'pending'
    /** No transaction spends the inputs and they are unspent again. The hex can be re-sent. */
    | 'not-in-mempool'
    /** The inputs were spent by a transaction that is not this transfer. */
    | 'spent-by-another-transaction'
    /** The backend shows neither a spending transaction nor the unspent inputs. */
    | 'unknown';

const getInputOutpoints = (transaction: Transaction) =>
    transaction.details.vin
        .filter(input => input.txid !== undefined)
        // Blockbook omits `vout` when it is zero.
        .map(input => getOutpointKey({ txid: input.txid ?? '', vout: input.vout ?? 0 }));

const isTheSweep = (transaction: Transaction, record: SignedSweepRecord) => {
    const inputOutpoints = getInputOutpoints(transaction);
    const [output, ...otherOutputs] = transaction.details.vout;

    return (
        inputOutpoints.length === record.outpoints.length &&
        inputOutpoints.every(outpoint => record.outpoints.includes(outpoint)) &&
        output !== undefined &&
        otherOutputs.length === 0 &&
        output.value === record.plan.amount &&
        output.addresses?.length === 1 &&
        output.addresses[0] === record.plan.destination.address
    );
};

export type EvaluateSweepStatusParams = {
    snapshot: AccountSnapshot;
    record: SignedSweepRecord;
};

/**
 * Finds out what became of a signed transfer by looking at who spends its inputs. The
 * transaction id is not used: anyone can change the id of a legacy transaction in flight.
 */
export const evaluateSweepStatus = ({
    snapshot,
    record,
}: EvaluateSweepStatusParams): SweepStatus => {
    const spendingTransactions = (snapshot.info.history.transactions ?? []).filter(transaction =>
        getInputOutpoints(transaction).some(outpoint => record.outpoints.includes(outpoint)),
    );

    if (spendingTransactions.length === 0) {
        const unspentOutpoints = new Set(snapshot.utxos.map(getOutpointKey));

        return record.outpoints.every(outpoint => unspentOutpoints.has(outpoint))
            ? 'not-in-mempool'
            : 'unknown';
    }

    const sweeps = spendingTransactions.filter(transaction => isTheSweep(transaction, record));
    if (sweeps.length !== spendingTransactions.length) return 'spent-by-another-transaction';

    return sweeps.some(transaction => !isPendingTransaction(transaction)) ? 'confirmed' : 'pending';
};

export type BroadcastSweepParams = {
    backend: Backend;
    record: SignedSweepRecord;
};

/**
 * Broadcasts the stored signed transaction. Calling it again after a failure re-sends the very
 * same bytes; a failed broadcast is never a reason to sign anew.
 */
export const broadcastSweep = ({ backend, record }: BroadcastSweepParams) =>
    backend.pushTransaction(record.hex);
