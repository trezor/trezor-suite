import { useMemo, useState, useEffect, useCallback } from 'react';

import { getSynchronize } from '@trezor/utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { fetchTransactionsThunk } from '@suite-common/wallet-core';
import { useDispatch } from 'src/hooks/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';

const getPaging = (network: Account['networkType'], txFetched: number, txTotal: number) => {
    const perPage = getTxsPerPage(network);
    // There is no total in XRP, so always presume there could be one more tx and calculate page count accordingly
    const totalItems = network === 'ripple' ? txFetched + 1 : txTotal;
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

    const [pagesFetched, setPagesFetched] = useState(1);
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
        (page: number, recursive: boolean) =>
            dispatch(
                fetchTransactionsThunk({
                    accountKey,
                    page,
                    perPage,
                    recursive,
                    noLoading: recursive,
                }),
            ),
        [dispatch, accountKey, perPage],
    );

    const fetchNext = useCallback(
        () =>
            synchronize(async () => {
                if (fetchedAll) return;
                setFetching(true);
                await fetchCommon(pagesFetched + 1, false);
                setFetching(false);
                setPagesFetched(pagesFetched + 1);
            }),
        [synchronize, fetchCommon, pagesFetched, fetchedAll],
    );

    const fetchAll = useCallback(
        () =>
            synchronize(async () => {
                if (fetchedAll) return;
                setFetching(true);
                await fetchCommon(pagesFetched + 1, true);
                setFetching(false);
                setFetchedAll(true);
            }),
        [synchronize, fetchCommon, pagesFetched, fetchedAll],
    );

    return { fetchNext, fetchAll, isFetching, fetchedAll };
};
