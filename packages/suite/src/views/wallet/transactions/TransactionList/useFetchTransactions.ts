import { useCallback, useEffect, useMemo, useState } from 'react';

import { getTxsPerPage } from '@suite-common/suite-utils';
import { isPhishingTransaction } from '@suite-common/token-definitions';
import {
    fetchAllTransactionsForAccountThunk,
    fetchTransactionsPageThunk,
    selectAccountTotalTransactions,
    selectAccountTransactionsWithNulls,
    selectActiveDustPhishingThreshold,
    selectIsLoadingAccountTransactions,
    selectPhishingTransactionsContext,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getTransactionsUntilGap } from '@suite-common/wallet-utils';
import { type AccountInfo } from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { getSynchronize } from '@trezor/utils';

import { useDiscovery, useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

import { shouldAttemptToLoadNextPageForVisibleTransactions } from './transaction-fetch-utils';

const isWithoutTotal = (network: Account['networkType']) =>
    network === 'ripple' || network === 'stellar';

const getPaging = (network: Account['networkType'], txFetched: number, txTotal: number) => {
    const perPage = getTxsPerPage(network);
    // There is no total in XRP and Stellar, so always presume there could be one more tx and calculate page count accordingly
    const totalItems = isWithoutTotal(network) ? txFetched + 1 : txTotal;
    const pagesTotal = Math.ceil(totalItems / perPage);
    // Consider incomplete pages unfetched unless fetched tx count equals total
    const page = txFetched === totalItems ? pagesTotal : Math.floor(txFetched / perPage);

    return { page, pagesTotal, perPage };
};

const NO_ACCOUNT_KEYS: ReadonlySet<AccountKey> = new Set();

/** The same reading of a page as the fetch-all thunk's, and an empty page has nothing after it. */
const hasPageAfter = (result: AccountInfo | 'ALREADY_FETCHED', page: number) =>
    result === 'ALREADY_FETCHED' ||
    (!!result.history.transactions?.length &&
        (page < (result.page?.total ?? 0) || !!result.marker || !!result.stellarCursor));

const hasMoreToLoad = (account: Account, loadedCount: number) =>
    isWithoutTotal(account.networkType)
        ? loadedCount % getTxsPerPage(account.networkType) === 0
        : loadedCount < account.history.total;

/**
 * Loads the accounts' histories together: a page is the page of every account, so the newest
 * transactions of them all stay complete. With one account it is that account's paging.
 */
export const useFetchTransactions = (accounts: readonly Account[]) => {
    const accountsKey = accounts.map(account => account.key).join('|');
    const transactionsByAccount = useSelector(state =>
        accounts.map(account => selectAccountTransactionsWithNulls(state, account.key)),
    );
    const pagings = accounts.map((account, index) =>
        getPaging(
            account.networkType,
            transactionsByAccount[index]?.length ?? 0,
            account.history.total,
        ),
    );
    const page = Math.min(...pagings.map(paging => paging.page));
    const isLastPage = pagings.every(paging => paging.page >= paging.pagesTotal);
    const loadedCounts = useMemo(
        () =>
            transactionsByAccount.map(transactions => getTransactionsUntilGap(transactions).length),
        [transactionsByAccount],
    );
    // Accounts whose last page said there is nothing after it, whatever their total says:
    // XRP and Stellar have no total, and Solana's total counts history beyond what it serves.
    const [exhaustedAccountKeys, setExhaustedAccountKeys] = useState(NO_ACCOUNT_KEYS);
    const canLoadMore = useCallback(
        (account: Account, loadedCount: number) =>
            !exhaustedAccountKeys.has(account.key) && hasMoreToLoad(account, loadedCount),
        [exhaustedAccountKeys],
    );
    const hasMore = accounts.some((account, index) =>
        canLoadMore(account, loadedCounts[index] ?? 0),
    );

    const [pagesFetched, setPagesFetched] = useState(page);
    const [isFetching, setFetching] = useState(false);
    const [fetchedAll, setFetchedAll] = useState(false);
    const [isFetchingAll, setFetchingAll] = useState(false);

    useEffect(() => {
        setPagesFetched(1);
        setFetching(false);
        setFetchedAll(false);
        setExhaustedAccountKeys(NO_ACCOUNT_KEYS);
    }, [accountsKey]);

    useEffect(() => {
        if (page > pagesFetched) {
            setPagesFetched(page);
        }
    }, [pagesFetched, page]);

    useEffect(() => {
        if (!fetchedAll && isLastPage) {
            setFetchedAll(true);
        }
    }, [fetchedAll, isLastPage]);

    const synchronize = useMemo(getSynchronize, [accountsKey]);
    const { dispatch } = useServices(injectDispatch);

    const fetchAccountPage = useCallback(
        (account: Account, page: number, noLoading = false) =>
            dispatch(
                fetchTransactionsPageThunk({
                    accountKey: account.key,
                    page,
                    perPage: getTxsPerPage(account.networkType),
                    noLoading,
                }),
            ),
        [dispatch],
    );

    const fetchPage = useCallback(
        (page: number, options: { noLoading?: boolean } = {}) => {
            synchronize(async () => {
                setFetching(true);
                await Promise.all(
                    accounts.map(account =>
                        fetchAccountPage(account, page, Boolean(options.noLoading)),
                    ),
                );
            }).finally(() => {
                setFetching(false);
            });
        },
        [accounts, fetchAccountPage, synchronize],
    );

    /** The next page of every account that still has one, filling a gap left by a page skipped before. */
    const fetchNext = useCallback(
        () =>
            synchronize(async () => {
                const pending = accounts.flatMap((account, index) => {
                    const loadedCount = loadedCounts[index] ?? 0;
                    const page = Math.floor(loadedCount / getTxsPerPage(account.networkType)) + 1;

                    return canLoadMore(account, loadedCount) ? [{ account, page }] : [];
                });

                if (pending.length === 0) return;

                setFetching(true);
                const haveMore = await Promise.all(
                    pending.map(({ account, page }) =>
                        fetchAccountPage(account, page)
                            .unwrap()
                            .then(
                                result => hasPageAfter(result, page),
                                () => false,
                            ),
                    ),
                );
                const exhausted = pending.filter((_, index) => !haveMore[index]);

                if (exhausted.length > 0) {
                    setExhaustedAccountKeys(
                        keys => new Set([...keys, ...exhausted.map(({ account }) => account.key)]),
                    );
                }
            }).finally(() => {
                setFetching(false);
            }),
        [synchronize, accounts, loadedCounts, canLoadMore, fetchAccountPage],
    );

    const fetchAll = useCallback(
        () =>
            synchronize(async () => {
                if (fetchedAll) return;
                setFetching(true);
                setFetchingAll(true);
                // NOTE: load all the transactions along but don't wait for it
                Promise.allSettled(
                    accounts.map(account =>
                        dispatch(fetchAllTransactionsForAccountThunk({ accountKey: account.key })),
                    ),
                ).finally(() => setFetchingAll(false));
                await Promise.all(
                    accounts.map(account => fetchAccountPage(account, pagesFetched + 1)),
                );
                setFetchedAll(true);
            }).finally(() => {
                setFetching(false);
            }),
        [synchronize, accounts, dispatch, fetchAccountPage, pagesFetched, fetchedAll],
    );

    return {
        fetchNext,
        pagesFetched,
        fetchPage,
        fetchAll,
        isFetching,
        isFetchingAll,
        fetchedAll,
        hasMore,
    };
};

type UseVisibleTransactionsParams = {
    account: Account;
    numberOfPagesRequested: number;
    enableFiltering?: boolean;
};

export const useVisibleTransactions = ({
    account,
    numberOfPagesRequested,
    enableFiltering = false,
}: UseVisibleTransactionsParams) => {
    const allTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, account.key),
    );
    const { isDiscoveryRunning } = useDiscovery();
    const accounts = useMemo(() => [account], [account]);

    const {
        fetchedAll,
        isFetching,
        pagesFetched: allTransactionsPagesFetched,
        fetchPage,
    } = useFetchTransactions(accounts);
    const allAccountTransactions = useSelector(state =>
        selectAccountTotalTransactions(state, account.key),
    );
    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, account.key),
    );
    const { tokenDefinitions, txsMarkedAsNotScam, historicRates } = useSelector(state =>
        selectPhishingTransactionsContext(state, account.key, account.symbol),
    );
    const dustThreshold = useSelector(selectActiveDustPhishingThreshold);

    const visibleTransactions = useMemo(
        () =>
            enableFiltering
                ? allTransactions.filter(
                      transaction =>
                          !isPhishingTransaction({
                              transaction,
                              tokenDefinitions,
                              txsMarkedAsNotScam,
                              historicRates,
                              dustThreshold,
                          }).isPhishing,
                  )
                : allTransactions,
        [
            enableFiltering,
            allTransactions,
            tokenDefinitions,
            txsMarkedAsNotScam,
            historicRates,
            dustThreshold,
        ],
    );

    const perPage = getTxsPerPage(account.networkType);
    // NOTE: as the paging increases / all is fetched, the number of the "all transactions" increases as the visible transactions decrease
    // that's how the estimate of the "totalPossiblyVisible" gets more an more accurate
    const numberOfHiddenInTheBatch = allTransactions.length - visibleTransactions.length;
    const totalPossiblyVisible = allAccountTransactions - numberOfHiddenInTheBatch;

    useEffect(() => {
        if (
            enableFiltering &&
            shouldAttemptToLoadNextPageForVisibleTransactions({
                totalNumberOfTransactions: allAccountTransactions,
                currentNumberOfVisibleTransactions: visibleTransactions.length,
                currentNumberOfTransactions: allTransactions.length,
                perPage,
                numberOfPagesRequested,
            })
        ) {
            fetchPage(allTransactionsPagesFetched + 1);
        }
    }, [
        account.networkType,
        allAccountTransactions,
        allTransactions.length,
        allTransactionsPagesFetched,
        enableFiltering,
        fetchPage,
        fetchedAll,
        numberOfPagesRequested,
        perPage,
        totalPossiblyVisible,
        visibleTransactions.length,
    ]);

    return {
        allTransactions,
        visibleTransactions,
        visibleTotal: totalPossiblyVisible,
        isFetching: isDiscoveryRunning || isFetching || transactionsIsLoading,
        isLoading: isDiscoveryRunning,
    };
};
