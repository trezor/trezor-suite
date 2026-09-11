import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type SearchAccountLabels } from './searchLabels';
import { simpleSearchTransactions } from './simpleSearchTransactions';
import { getTransactionSearchLookups } from './transactionSearchIndex';

export const advancedSearchTransactions = (
    transactions: WalletAccountTransaction[],
    accountLabels: SearchAccountLabels,
    search: string,
) => {
    // No AND/OR operators, just run a simple search
    if (!search.includes('&') && !search.includes('|')) {
        return simpleSearchTransactions(transactions, accountLabels, search);
    }

    // Split by OR operator first
    let orSplit = search.split('|').filter(s => s.trim() !== '');
    if (!orSplit || orSplit.length === 1) {
        orSplit = [search.replace('|', '')];
    }

    // Get all TxIDs matching the searches
    const filteredTxIDs = new Set([
        ...orSplit.flatMap(or => {
            // And searches (only keep results that appear X (split) times)
            const andSplit = or.split('&');
            if (!andSplit || andSplit.length === 1) {
                return simpleSearchTransactions(
                    transactions,
                    accountLabels,
                    or.replace('&', ''),
                ).flatMap(t => t.txid);
            }

            const andTxs = andSplit.flatMap(and =>
                simpleSearchTransactions(transactions, accountLabels, and).map(t => t.txid),
            );

            const transactionCount: { [txid: string]: number } = {};

            return andTxs.filter(txid => {
                if (!transactionCount[txid]) {
                    transactionCount[txid] = 0;
                }

                transactionCount[txid]++;

                return transactionCount[txid] === andSplit.length;
            });
        }),
    ]);

    // The terms above worked in txids, so getting back to the transactions is a lookup per match
    // rather than a pass over every transaction — which, after each term already made one pass of
    // its own, is the difference between one scan and four for `alice&rent|bob`.
    //
    // Sorted by position because that is the array's own order, and the list paginates by index
    // and renders by date: handing back the order the search terms happened to match in would
    // shuffle the pages.
    const { positionByTxid, transactionsByTxid } = getTransactionSearchLookups(transactions);

    return [...filteredTxIDs]
        .filter(txid => positionByTxid.has(txid))
        .sort((left, right) => (positionByTxid.get(left) ?? 0) - (positionByTxid.get(right) ?? 0))
        .map(txid => transactionsByTxid.get(txid) as WalletAccountTransaction);
};
