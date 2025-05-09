import { useCallback, useEffect, useMemo, useState } from 'react';

import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    getIsPhishingTransaction,
    selectNetworkTokenDefinitions,
} from '@suite-common/token-definitions';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import {
    fetchAllTransactionsForAccountThunk,
    fetchTransactionsPageThunk,
    selectAccountTotalTransactions,
    selectAccountTransactionsWithNulls,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';
import { getSynchronize } from '@trezor/utils';

import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';

import { shouldAttemptToLoadNextPageForVisibleTransactions } from './transaction-fetch-utils';

const getPaging = (network: Account['networkType'], txFetched: number, txTotal: number) => {
    const perPage = getTxsPerPage(network);
    // There is no total in XRP and Stellar, so always presume there could be one more tx and calculate page count accordingly
    const totalItems = network === 'ripple' || network === 'stellar' ? txFetched + 1 : txTotal;
    const pagesTotal = Math.ceil(totalItems / perPage);
    // Consider incomplete pages unfetched unless fetched tx count equals total
    const page = txFetched === totalItems ? pagesTotal : Math.floor(txFetched / perPage);

    return { page, pagesTotal, perPage };
};

export const useFetchTransactions = (
    account: Account,
    transactions: WalletAccountTransaction[],
) => {
    const accountKey = account.key;
    const { page, pagesTotal, perPage } = getPaging(
        account.networkType,
        transactions.length,
        account.history.total,
    );

    const [pagesFetched, setPagesFetched] = useState(page);
    const [isFetching, setFetching] = useState(false);
    const [fetchedAll, setFetchedAll] = useState(false);

    useEffect(() => {
        setPagesFetched(1);
        setFetching(false);
        setFetchedAll(false);
    }, [accountKey]);

    useEffect(() => {
        if (page > pagesFetched) {
            setPagesFetched(page);
        }
    }, [pagesFetched, page]);

    const isLastPage = pagesFetched >= pagesTotal;

    useEffect(() => {
        if (!fetchedAll && isLastPage) {
            setFetchedAll(true);
        }
    }, [fetchedAll, isLastPage]);

    const synchronize = useMemo(getSynchronize, [accountKey]);
    const dispatch = useDispatch();

    const fetchCommon = useCallback(
        (
            page: number,
            options: {
                recursive?: boolean;
            } = {},
        ) => {
            if (options.recursive) {
                // NOTE: when recursion is requested, load all the transactions along but don't wait for it
                dispatch(fetchAllTransactionsForAccountThunk({ accountKey }));
            }

            return dispatch(
                fetchTransactionsPageThunk({
                    accountKey: account.key,
                    page,
                    perPage,
                }),
            );
        },
        [dispatch, account.key, perPage, accountKey],
    );

    const fetchPage = useCallback(
        (
            page: number,
            options: {
                recursive?: boolean;
                noLoading?: boolean;
            } = {},
        ) => {
            synchronize(async () => {
                setFetching(true);
                await dispatch(
                    fetchTransactionsPageThunk({
                        accountKey: account.key,
                        page,
                        perPage,
                        noLoading: Boolean(options.noLoading),
                    }),
                );
            }).finally(() => {
                setFetching(false);
            });
        },
        [account.key, dispatch, perPage, synchronize],
    );

    const fetchNext = useCallback(
        () =>
            synchronize(async () => {
                if (fetchedAll) return;
                setFetching(true);
                await fetchCommon(pagesFetched + 1);
                setPagesFetched(pagesFetched + 1);
            }).finally(() => {
                setFetching(false);
            }),
        [synchronize, fetchCommon, pagesFetched, fetchedAll],
    );

    const fetchAll = useCallback(
        () =>
            synchronize(async () => {
                if (fetchedAll) return;
                setFetching(true);
                await fetchCommon(pagesFetched + 1, {
                    recursive: true,
                });
                setFetchedAll(true);
            }).finally(() => {
                setFetching(false);
            }),
        [synchronize, fetchCommon, pagesFetched, fetchedAll],
    );

    return { fetchNext, pagesFetched, fetchPage, fetchAll, isFetching, fetchedAll };
};

export const useVisibleTransactions = ({
    account,
    numberOfPagesRequested,
    enableFiltering = false,
}: {
    account: Account;
    numberOfPagesRequested: number;
    enableFiltering?: boolean;
}) => {
    const allTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, account.key),
    );
    const { discovery } = useDiscovery();

    const {
        fetchedAll,
        isFetching,
        pagesFetched: allTransactionsPagesFetched,
        fetchPage,
    } = useFetchTransactions(account, allTransactions);
    const allAccountTransactions = useSelector(state =>
        selectAccountTotalTransactions(state, account.key),
    );
    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, account.key),
    );
    const tokenDefinitions = useSelector(state =>
        selectNetworkTokenDefinitions(state, account.symbol),
    );

    const visibleTransactions = useMemo(
        () =>
            tokenDefinitions && enableFiltering
                ? allTransactions.filter(
                      transaction =>
                          // NOTE: due to some weirdness, the transaction here can be `undefined`!
                          transaction
                              ? !getIsPhishingTransaction(transaction, tokenDefinitions)
                              : false, // NOTE: when transaction is falsy, hide it
                  )
                : allTransactions,
        [allTransactions, tokenDefinitions, enableFiltering],
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

    const isLoading = discovery && discovery?.status !== DiscoveryStatus.COMPLETED; // NOTE: loading indicates that the state of the data is unknown and we are "loading for the first time"

    return {
        allTransactions,
        visibleTransactions,
        visibleTotal: totalPossiblyVisible,
        isFetching: isLoading || isFetching || transactionsIsLoading,
        isLoading,
    };
};
