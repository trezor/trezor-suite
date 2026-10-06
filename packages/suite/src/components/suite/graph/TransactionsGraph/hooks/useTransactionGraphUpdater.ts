import { useMemo } from 'react';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { selectAccountTransactionsWithNulls } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
// Only the newest transactions can still move the graph, the ones behind them are already part of
// the graph data cached in the store. Watching a longer window would only churn the cache key.
const WATCHED_TRANSACTIONS_COUNT = 3;

type UseTransactionGraphUpdaterParams = {
    /** Graph of all assets (dashboard) belongs to no single account, hence optional. */
    accountKey: AccountKey | undefined;
    onRequestGraphUpdate: ((abortSignal: AbortSignal) => Promise<unknown>) | undefined;
};

/**
 * Keeps the account graph in sync with the transaction list: an update is requested on mount and
 * then whenever the newest confirmed transactions change, meaning a transaction that the graph data
 * doesn't include yet got mined.
 *
 * The update runs as a query so that an update which became outdated is aborted as soon as a newer
 * one is needed (or the graph is unmounted) instead of racing it — `fetchAccountGraphData` then
 * stops before dispatching its result.
 *
 * `accountKey` is the only part of the account that takes part in this: other account changes
 * (balance, tokens, nonce, ...) never require the graph to be refetched on their own, the
 * transaction behind such a change appears in the transaction list as well.
 */
export const useTransactionGraphUpdater = ({
    accountKey,
    onRequestGraphUpdate,
}: UseTransactionGraphUpdaterParams) => {
    const allTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey ?? null),
    );

    // Transactions of not-yet-fetched pages are null placeholders and a pending transaction is not
    // part of the graph data yet, so neither of them may take part in the identity.
    const newestConfirmedTxids = useMemo(
        () =>
            allTransactions
                .slice(0, WATCHED_TRANSACTIONS_COUNT)
                .filter(transaction => Boolean(transaction) && !isPending(transaction))
                .map(transaction => transaction.txid)
                .join('-'),
        [allTransactions],
    );

    useQuery({
        queryKey: desktopQueryKeys.accountGraphUpdate(accountKey, newestConfirmedTxids),
        queryFn: async ({ signal }) => {
            await onRequestGraphUpdate?.(signal);

            // The graph data itself lives in redux, there is nothing to cache here — but `undefined`
            // is not an allowed query result.
            return null;
        },
        enabled: accountKey !== undefined && onRequestGraphUpdate !== undefined,
        // Refetching is driven by new transactions, which arrive over the blockchain subscription
        // regardless of the window being focused, so a refetch on focus would only ever repeat the
        // very same update.
        refetchOnWindowFocus: false,
    });
};
