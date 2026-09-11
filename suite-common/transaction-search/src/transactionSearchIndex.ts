import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type Address, type SearchAccountLabels, type TxId } from './searchLabels';

/**
 * The lookups a search runs against, turned inside out once so that a query can read them instead
 * of walking the transactions again.
 */
export type TransactionSearchIndex = {
    /** Every transaction that paid to or from an address — inputs, outputs and targets. */
    txidsByAddress: Record<Address, Set<TxId>>;
    /**
     * Where a transaction sits in the array, so a search that ends up holding txids can get back
     * to the transactions without walking all of them — and can put them back in the array's own
     * order, which is the order the list paginates and renders.
     */
    positionByTxid: Map<TxId, number>;
    txidsByOutputLabel: Record<string, TxId[]>;
    addressesByLabel: Record<string, Address[]>;
};

const buildPositionByTxid = (transactions: WalletAccountTransaction[]) => {
    const positionByTxid = new Map<TxId, number>();

    // `forEach` skips the holes a not-yet-fetched page leaves, which is what keeps them out of
    // every search result.
    transactions.forEach((transaction, position) => positionByTxid.set(transaction.txid, position));

    return positionByTxid;
};

const buildTxidsByAddress = (transactions: WalletAccountTransaction[]) => {
    const txidsByAddress: Record<Address, Set<TxId>> = {};

    const add = (txid: TxId, addresses: string[] | undefined) =>
        addresses?.forEach(address => {
            if (!txidsByAddress[address]) {
                txidsByAddress[address] = new Set();
            }
            txidsByAddress[address].add(txid);
        });

    transactions.forEach(transaction => {
        transaction.details.vin.forEach(vin => add(transaction.txid, vin.addresses));
        transaction.details.vout.forEach(vout => add(transaction.txid, vout.addresses));
        transaction.targets.forEach(target => add(transaction.txid, target.addresses));
    });

    return txidsByAddress;
};

const buildTxidsByOutputLabel = ({ outputLabels }: SearchAccountLabels) => {
    const txidsByOutputLabel: Record<string, TxId[]> = {};

    outputLabels.forEach((accountOutputLabels, txid) => {
        accountOutputLabels.forEach(label => {
            if (!txidsByOutputLabel[label]) {
                txidsByOutputLabel[label] = [];
            }
            txidsByOutputLabel[label].push(txid);
        });
    });

    return txidsByOutputLabel;
};

const buildAddressesByLabel = ({ addressLabels }: SearchAccountLabels) => {
    const addressesByLabel: Record<string, Address[]> = {};

    addressLabels.forEach((label, address) => {
        if (!addressesByLabel[label]) {
            addressesByLabel[label] = [];
        }
        addressesByLabel[label].push(address);
    });

    return addressesByLabel;
};

/**
 * Kept against the transactions and the labels it was built from, so that it is built once for as
 * long as neither changes.
 *
 * Both come from memoized selectors, so typing in the search box hands the same two objects over
 * on every keystroke — and an advanced query hands them over once per `&`/`|` term. Without this,
 * every one of those rebuilt the address map by walking every input, output and target of every
 * transaction, to answer a question the previous keystroke had already answered.
 */
const builtIndexes = new WeakMap<
    WalletAccountTransaction[],
    WeakMap<SearchAccountLabels, TransactionSearchIndex>
>();

export const getTransactionSearchIndex = (
    transactions: WalletAccountTransaction[],
    accountLabels: SearchAccountLabels,
): TransactionSearchIndex => {
    const byLabels = builtIndexes.get(transactions) ?? new WeakMap();
    builtIndexes.set(transactions, byLabels);

    const built = byLabels.get(accountLabels);
    if (built) {
        return built;
    }

    const index: TransactionSearchIndex = {
        txidsByAddress: buildTxidsByAddress(transactions),
        positionByTxid: buildPositionByTxid(transactions),
        txidsByOutputLabel: buildTxidsByOutputLabel(accountLabels),
        addressesByLabel: buildAddressesByLabel(accountLabels),
    };
    byLabels.set(accountLabels, index);

    return index;
};
