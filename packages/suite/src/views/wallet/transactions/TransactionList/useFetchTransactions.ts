import { useCallback, useEffect, useMemo, useState } from 'react';

import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    fetchAllTransactionsForAccountThunk,
    fetchTransactionsPageThunk,
} from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { getSynchronize } from '@trezor/utils';

import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

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
    const { dispatch } = useServices(injectDispatch);

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
