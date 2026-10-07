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

    /** Every loaded transaction, newest first. */
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

    const query = useInfiniteQuery({
        queryKey,
        queryFn:
            isEnabled && ref
                ? ({ pageParam, signal }) => getTransactions({ ref, cursor: pageParam, signal })
                : skipToken,
        initialPageParam: FIRST_PAGE,
        getNextPageParam: (lastPage: ChainTransactionsPage) => lastPage.nextCursor ?? undefined,
        staleTime: network?.syncPolicy.accountStaleTimeMs,
        refetchInterval: current =>
            network && current.state.data?.pages.some(page => page.transactions.some(isPending))
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
    const transactions = useMemo(() => pages.flatMap(page => page.transactions), [pages]);

    const { fetchNextPage, hasNextPage } = query;
    const loadedCount = transactions.length;
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
        total: pages[0]?.total ?? null,
        hasNextPage,
        fetchNextPage,
        loadUntil,
        isPending: query.isPending,
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
    };
};
