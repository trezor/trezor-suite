import type { Transaction, Utxo } from '@trezor/blockchain-link-types';

import type { AccountSnapshot } from './accountSnapshot';
import { getOutpointKey } from '../bitcoin/outpoint';
import { isConfirmedUtxo, isWellFormedUtxo } from '../bitcoin/utxo';

export type InFlightTransfer = {
    txid: string;
    /** Outpoints of this account that the pending transaction spends. */
    spentOutpoints: string[];
};

export type AmbiguityReason =
    /** The backend lists an output as unspent while a pending transaction already spends it. */
    | 'utxo-spent-in-mempool'
    /** The backend reports more pending transactions than the history page contains. */
    | 'pending-history-incomplete'
    /** An unspent output is missing data or carries data of the wrong shape. */
    | 'malformed-utxo'
    /** The same outpoint is listed more than once. */
    | 'duplicate-utxo';

/**
 * State of one account rebuilt purely from backend data. Nothing is persisted in the browser,
 * so this is also what the app knows about earlier transfers after a page reload.
 */
export type AccountState = {
    /** Confirmed outputs no pending transaction spends. Only these may be composed. */
    spendable: Utxo[];
    /** Outputs that are not confirmed yet. They are never spent. */
    unconfirmed: Utxo[];
    /** Pending transactions spending this account's outputs, such as an earlier transfer. */
    inFlight: InFlightTransfer[];
    /** Reasons the backend data is inconsistent. While any is present, nothing is signed. */
    ambiguities: AmbiguityReason[];
};

export const isPendingTransaction = ({ blockHeight }: Pick<Transaction, 'blockHeight'>) =>
    blockHeight === undefined || blockHeight <= 0;

const getSpentOutpoints = (transaction: Transaction, isOwnedOnly: boolean) =>
    transaction.details.vin
        .filter(input => input.txid !== undefined && (!isOwnedOnly || input.isAccountOwned))
        // Blockbook omits `vout` when it is zero.
        .map(input => getOutpointKey({ txid: input.txid ?? '', vout: input.vout ?? 0 }));

export const evaluateAccountState = ({ info, utxos }: AccountSnapshot): AccountState => {
    const transactions = info.history.transactions ?? [];
    const pendingTransactions = transactions.filter(isPendingTransaction);

    const inFlight = pendingTransactions
        .map(transaction => ({
            txid: transaction.txid,
            spentOutpoints: getSpentOutpoints(transaction, true),
        }))
        .filter(({ spentOutpoints }) => spentOutpoints.length > 0);

    const spentInMempool = new Set(
        pendingTransactions.flatMap(transaction => getSpentOutpoints(transaction, false)),
    );

    const ambiguities = new Set<AmbiguityReason>();
    if (info.history.unconfirmed > pendingTransactions.length) {
        ambiguities.add('pending-history-incomplete');
    }

    const spendable: Utxo[] = [];
    const unconfirmed: Utxo[] = [];
    const seenOutpoints = new Set<string>();

    utxos.forEach(utxo => {
        if (!isWellFormedUtxo(utxo)) {
            ambiguities.add('malformed-utxo');

            return;
        }

        const outpoint = getOutpointKey(utxo);

        if (seenOutpoints.has(outpoint)) {
            ambiguities.add('duplicate-utxo');

            return;
        }
        seenOutpoints.add(outpoint);

        if (spentInMempool.has(outpoint)) {
            ambiguities.add('utxo-spent-in-mempool');

            return;
        }

        if (!isConfirmedUtxo(utxo)) {
            unconfirmed.push(utxo);

            return;
        }

        spendable.push(utxo);
    });

    return { spendable, unconfirmed, inFlight, ambiguities: [...ambiguities] };
};
