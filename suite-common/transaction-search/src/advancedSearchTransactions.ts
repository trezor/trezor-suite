import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type SearchAccountLabels } from './searchLabels';
import { simpleSearchTransactions } from './simpleSearchTransactions';

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

    return transactions.filter(t => filteredTxIDs.has(t.txid));
};

/**
 * Per-transaction variant of {@link simpleSearchTransactions}: returns whether a
 * single transaction matches a simple (operator-free of `&`/`|`) search term.
 *
 * Every branch of `simpleSearchTransactions` decides per transaction and never
 * depends on the other transactions in the array, so running it on `[transaction]`
 * yields exactly the same decision for that transaction. This keeps behavior
 * identical without touching the existing implementation.
 */
export const transactionMatchesSimpleSearch = (
    transaction: WalletAccountTransaction,
    accountLabels: SearchAccountLabels,
    search: string,
): boolean => simpleSearchTransactions([transaction], accountLabels, search).length > 0;

/**
 * Per-transaction variant of {@link advancedSearchTransactions}: returns whether
 * a single transaction matches an advanced query with `&` (AND) / `|` (OR)
 * operators. A transaction matches when any OR group matches, and an OR group
 * matches when all of its AND terms match that transaction.
 *
 * Designed to be used as a predicate (e.g. with `defineFilterQuery`), so search
 * can be re-evaluated incrementally for only the transactions that changed.
 */
export const transactionMatchesAdvancedSearch = (
    transaction: WalletAccountTransaction,
    accountLabels: SearchAccountLabels,
    search: string,
): boolean => {
    // No AND/OR operators, just a simple search.
    if (!search.includes('&') && !search.includes('|')) {
        return transactionMatchesSimpleSearch(transaction, accountLabels, search);
    }

    let orSplit = search.split('|').filter(s => s.trim() !== '');
    if (orSplit.length <= 1) {
        orSplit = [search.replace('|', '')];
    }

    return orSplit.some(or => {
        const andSplit = or.split('&');
        if (andSplit.length <= 1) {
            return transactionMatchesSimpleSearch(transaction, accountLabels, or.replace('&', ''));
        }

        // OR group matches only if every AND term matches this transaction.
        return andSplit.every(and =>
            transactionMatchesSimpleSearch(transaction, accountLabels, and),
        );
    });
};
