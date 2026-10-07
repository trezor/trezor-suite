import { useCallback, useEffect, useMemo, useState } from 'react';

import { getTxsPerPage } from '@suite-common/suite-utils';
import { isPhishingTransaction } from '@suite-common/token-definitions';
import {
    selectActiveDustPhishingThreshold,
    selectPhishingTransactionsContext,
} from '@suite-common/wallet-core';
import { getSynchronize } from '@trezor/utils';

import { useDiscovery, useSelector } from 'src/hooks/suite';
import { type AccountTransactionsSource } from 'src/hooks/wallet/chainData/useAccountTransactionsSource';
import { type Account } from 'src/types/wallet';

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

export const useFetchTransactions = (account: Account, source: AccountTransactionsSource) => {
    const accountKey = account.key;
    const { page, pagesTotal, perPage } = getPaging(
        account.networkType,
        source.transactions.length,
        source.total,
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
    const { fetchPage: fetchSourcePage, fetchAll: fetchSourceAll } = source;

    const fetchCommon = useCallback(
        (
            page: number,
            options: {
                recursive?: boolean;
            } = {},
        ) => {
            if (options.recursive) {
                // NOTE: when recursion is requested, load all the transactions along but don't wait for it
                fetchSourceAll();
            }

            return fetchSourcePage(page, perPage);
        },
        [fetchSourceAll, fetchSourcePage, perPage],
    );

    const fetchPage = useCallback(
        (
            page: number,
            options: {
                noLoading?: boolean;
            } = {},
        ) => {
            synchronize(async () => {
                setFetching(true);
                await fetchSourcePage(page, perPage, { noLoading: Boolean(options.noLoading) });
            }).finally(() => {
                setFetching(false);
            });
        },
        [fetchSourcePage, perPage, synchronize],
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

type UseVisibleTransactionsParams = {
    account: Account;
    source: AccountTransactionsSource;
    numberOfPagesRequested: number;
    enableFiltering?: boolean;
};

export const useVisibleTransactions = ({
    account,
    source,
    numberOfPagesRequested,
    enableFiltering = false,
}: UseVisibleTransactionsParams) => {
    const allTransactions = source.transactions;
    const { isDiscoveryRunning } = useDiscovery();

    const {
        fetchedAll,
        isFetching,
        pagesFetched: allTransactionsPagesFetched,
        fetchPage,
    } = useFetchTransactions(account, source);
    const allAccountTransactions = source.total;
    const transactionsIsLoading = source.isLoading;
    const { historicRates } = source;
    const { tokenDefinitions, txsMarkedAsNotScam } = useSelector(state =>
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
