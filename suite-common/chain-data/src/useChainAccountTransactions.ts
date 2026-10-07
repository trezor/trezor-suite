import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
    CONFIDENTIAL_QUERY_META,
    chainQueryKeys,
    skipToken,
    useInfiniteQuery,
    useQuery,
    useQueryClient,
} from '@suite-common/react-query';
import type { Transaction } from '@trezor/blockchain-link-types';
import type {
    ChainAccountRef,
    ChainNetwork,
    ChainTransactionsCursor,
    ChainTransactionsPage,
} from '@trezor/network-module-suite-common-types';

import { getChainPendingSendsQueryOptions, getVisiblePendingSends } from './chainPendingSends';
import { getChainAccountBalanceQueryOptions } from './chainQueryOptions';

const FIRST_PAGE: ChainTransactionsCursor = { page: 1 };

// A failed page is retried once; paging further waits for the user anyway.
const RETRY_COUNT = 1;

const isPending = (transaction: Transaction) =>
    !transaction.blockHeight || transaction.blockHeight < 0;

export type UseChainAccountTransactionsParams = {
    /** `undefined` while the account's network is not selected. */
    network: ChainNetwork | undefined;
    ref: ChainAccountRef | null;
    enabled: boolean;
};

export type ChainAccountTransactions = {
    pages: readonly ChainTransactionsPage[];

    /**
     * Every loaded transaction, newest first. Transactions the wallet broadcast come first until
     * the backend lists them, and hide the transactions they replace.
     */
    transactions: readonly Transaction[];

    /** Transactions in the whole history, `null` where the backend does not know it. */
    total: number | null;
    hasNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;

    /** Loads pages in order until at least `count` transactions are loaded, or all of them. */
    loadUntil: (count: number | 'all') => Promise<void>;
    isPending: boolean;
    isFetching: boolean;
    isFetchingNextPage: boolean;
};

const NO_PAGES: readonly ChainTransactionsPage[] = [];
const NO_PENDING_SENDS = [] as const;

/**
 * An account's history, page by page in order. Pages stay cached while the history is unchanged;
 * the history is read again when the account's balance changes, and refreshed at the network's
 * interval while a loaded transaction is still pending.
 */
export const useChainAccountTransactions = (
    params: UseChainAccountTransactionsParams,
): ChainAccountTransactions => {
    const queryClient = useQueryClient();
    const { network, ref } = params;
    const getTransactions = network?.getTransactions;
    const isEnabled = params.enabled && !!network && !!ref && !!getTransactions;

    const queryKey =
        network && ref
            ? chainQueryKeys.accountTransactions(
                  network.symbol,
                  network.backendType,
                  ref.descriptor,
              )
            : chainQueryKeys.all('uncovered');

    const pendingSendsOptions =
        network && ref ? getChainPendingSendsQueryOptions(network, ref.descriptor) : undefined;
    const pendingSendsQuery = useQuery(
        pendingSendsOptions ?? { queryKey: chainQueryKeys.all('uncovered'), queryFn: skipToken },
    );
    const pendingSends = pendingSendsQuery.data ?? NO_PENDING_SENDS;

    const query = useInfiniteQuery({
        queryKey,
        queryFn:
            isEnabled && ref
                ? ({ pageParam, signal }) => getTransactions({ ref, cursor: pageParam, signal })
                : skipToken,
        initialPageParam: FIRST_PAGE,
        getNextPageParam: (lastPage: ChainTransactionsPage) => lastPage.nextCursor ?? undefined,
        staleTime: network?.syncPolicy.accountStaleTimeMs,
        // While a transaction is pending, or a broadcast one not listed yet, look again regularly.
        refetchInterval: current =>
            network &&
            (pendingSends.length > 0 ||
                current.state.data?.pages.some(page => page.transactions.some(isPending)))
                ? network.syncPolicy.accountRefetchIntervalMs
                : false,
        refetchIntervalInBackground: false,
        retry: RETRY_COUNT,
        meta: CONFIDENTIAL_QUERY_META,
    });

    // The balance query is shared with every other view of the account; a changed balance means
    // the history changed too.
    const balance = useQuery(
        network && ref
            ? getChainAccountBalanceQueryOptions({ network, ref, enabled: isEnabled })
            : { queryKey: chainQueryKeys.all('uncovered'), queryFn: skipToken },
    );
    const balanceKey = balance.data ? JSON.stringify(balance.data) : undefined;
    const previousBalanceKey = useRef(balanceKey);
    useEffect(() => {
        if (
            isEnabled &&
            previousBalanceKey.current !== undefined &&
            balanceKey !== undefined &&
            balanceKey !== previousBalanceKey.current
        ) {
            queryClient.invalidateQueries({ queryKey });
        }
        previousBalanceKey.current = balanceKey;
        // The key is rebuilt every render; its parts are what identify it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        balanceKey,
        isEnabled,
        queryClient,
        network?.symbol,
        network?.backendType,
        ref?.descriptor,
    ]);

    const pages = query.data?.pages ?? NO_PAGES;
    const fetchedTransactions = useMemo(() => pages.flatMap(page => page.transactions), [pages]);

    // Expiry is measured at the last fetch: the history is refetched regularly while pending
    // sends exist, and a pending send must not vanish between two fetches.
    const fetchedAt = query.dataUpdatedAt;
    const visiblePendingSends = useMemo(
        () =>
            getVisiblePendingSends(
                pendingSends,
                new Set(fetchedTransactions.map(transaction => transaction.txid)),
                fetchedAt,
            ),
        [pendingSends, fetchedTransactions, fetchedAt],
    );

    // Listed or expired pending sends are dropped from the cache too.
    useEffect(() => {
        if (pendingSendsOptions && visiblePendingSends.length !== pendingSends.length) {
            queryClient.setQueryData(pendingSendsOptions.queryKey, visiblePendingSends);
        }
        // The options are rebuilt every render; the data they hold is what matters.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visiblePendingSends, pendingSends, queryClient]);

    const transactions = useMemo(() => {
        if (visiblePendingSends.length === 0) return fetchedTransactions;

        const replacedTxids = new Set(visiblePendingSends.map(send => send.replacedTxid));

        return [
            ...visiblePendingSends.map(send => send.transaction),
            ...fetchedTransactions.filter(transaction => !replacedTxids.has(transaction.txid)),
        ];
    }, [visiblePendingSends, fetchedTransactions]);

    const { fetchNextPage, hasNextPage } = query;
    const loadedCount = fetchedTransactions.length;
    const loadUntil = useCallback(
        async (count: number | 'all') => {
            let state = { hasNextPage, loadedCount };
            while (state.hasNextPage && (count === 'all' || state.loadedCount < count)) {
                const next = await fetchNextPage();
                if (next.isError) return;

                state = {
                    hasNextPage: next.hasNextPage,
                    loadedCount: (next.data?.pages ?? []).reduce(
                        (sum, page) => sum + page.transactions.length,
                        0,
                    ),
                };
            }
        },
        [fetchNextPage, hasNextPage, loadedCount],
    );

    return {
        pages,
        transactions,
        total: pages[0]?.total == null ? null : pages[0].total + visiblePendingSends.length,
        hasNextPage,
        fetchNextPage,
        loadUntil,
        isPending: query.isPending,
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
    };
};
