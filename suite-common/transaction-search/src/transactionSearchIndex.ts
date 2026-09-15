import { type EntityGroup, createEntityIndex } from '@suite-common/redux-utils';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type Address, type SearchAccountLabels, type TxId } from './searchLabels';

/**
 * The transactions a search is over, indexed by the things a query asks about.
 *
 * This is `createEntityIndex` with the array in place of the store: the search is handed an array
 * rather than state, and identity is the only thing the index needs of its source. Everything else
 * it gives for free — built once per array, carried over while the array is the same object, which
 * is what stops the search box rebuilding all of this on every keystroke.
 */
const transactionsIndex = createEntityIndex({
    name: 'searchTransactions',
    selectSource: (transactions: readonly WalletAccountTransaction[]) => transactions,
    *getEntities(transactions) {
        for (const transaction of transactions) {
            // The array is sparse — a not-yet-fetched page is a hole — and skipping those here is
            // what keeps them out of every search result.
            if (transaction) {
                yield transaction;
            }
        }
    },
    // A txid identifies a transaction within one account's array, which is all a search sees.
    getId: (transaction: WalletAccountTransaction) => transaction.txid as TxId,
    groupBy: {
        /** Every transaction that paid to or from an address — inputs, outputs and targets. */
        byAddress: (transaction: WalletAccountTransaction): Address[] => [
            ...transaction.details.vin.flatMap(vin => vin.addresses ?? []),
            ...transaction.details.vout.flatMap(vout => vout.addresses ?? []),
            ...transaction.targets.flatMap(target => target.addresses ?? []),
        ],
    },
});

// Derived from the index's own id list, which is stable while the transactions are, so this is
// built once alongside it rather than once per query.
const positionsByIds = new WeakMap<readonly TxId[], ReadonlyMap<TxId, number>>();

export type TransactionSearchLookups = {
    /** The transactions that used an address, by address. */
    byAddress: ReadonlyMap<Address, EntityGroup<WalletAccountTransaction, TxId>>;
    /** Every transaction the search can return, by txid. */
    transactionsByTxid: ReadonlyMap<TxId, WalletAccountTransaction>;
    /**
     * Where a transaction sits among the others, so a search holding txids can put them back in
     * the array's own order — the order the list paginates by index and renders by date.
     */
    positionByTxid: ReadonlyMap<TxId, number>;
};

export const getTransactionSearchLookups = (
    transactions: readonly WalletAccountTransaction[],
): TransactionSearchLookups => {
    const { ids, byId, groups } = transactionsIndex.read(transactions);

    const positionByTxid =
        positionsByIds.get(ids) ?? new Map(ids.map((txid, position) => [txid, position]));
    positionsByIds.set(ids, positionByTxid);

    return { byAddress: groups.byAddress, transactionsByTxid: byId, positionByTxid };
};

export type LabelSearchLookups = {
    txidsByOutputLabel: ReadonlyMap<string, readonly TxId[]>;
    addressesByLabel: ReadonlyMap<string, readonly Address[]>;
};

// Labels are not entities and are not indexed with them: they change on their own, and inverting
// them has nothing to do with which transactions are in the array.
const labelLookups = new WeakMap<SearchAccountLabels, LabelSearchLookups>();

const invert = <TKey, TValue>(entries: Iterable<[TKey, TValue]>) => {
    const inverted = new Map<TValue, TKey[]>();

    for (const [key, value] of entries) {
        const existing = inverted.get(value);

        if (existing) {
            existing.push(key);
        } else {
            inverted.set(value, [key]);
        }
    }

    return inverted;
};

export const getLabelSearchLookups = (accountLabels: SearchAccountLabels): LabelSearchLookups => {
    const built = labelLookups.get(accountLabels);
    if (built) {
        return built;
    }

    const lookups: LabelSearchLookups = {
        txidsByOutputLabel: invert(
            [...accountLabels.outputLabels].flatMap(([txid, outputLabels]) =>
                [...outputLabels.values()].map(label => [txid, label] as [TxId, string]),
            ),
        ),
        addressesByLabel: invert(accountLabels.addressLabels),
    };
    labelLookups.set(accountLabels, lookups);

    return lookups;
};
