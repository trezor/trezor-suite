import { useState } from 'react';

import { fetchTransactionsPageThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { type PageRequest } from '../assetTransactionsUtils';

const NO_ACCOUNT_KEYS: ReadonlySet<AccountKey> = new Set();

const addAccountKey = (accountKeys: ReadonlySet<AccountKey>, accountKey: AccountKey) =>
    new Set([...accountKeys, accountKey]);

const removeAccountKey = (accountKeys: ReadonlySet<AccountKey>, accountKey: AccountKey) =>
    accountKeys.has(accountKey)
        ? new Set([...accountKeys].filter(key => key !== accountKey))
        : accountKeys;

export const useAccountPageFetching = (perPage: number) => {
    const { dispatch } = useServices(injectDispatch);

    const [fetchedPageByAccount, setFetchedPageByAccount] = useState<
        Partial<Record<AccountKey, number>>
    >({});
    const [exhaustedAccountKeys, setExhaustedAccountKeys] = useState(NO_ACCOUNT_KEYS);
    const [failedAccountKeys, setFailedAccountKeys] = useState(NO_ACCOUNT_KEYS);
    const [isFetching, setIsFetching] = useState(false);

    const fetchAccountPage = ({ accountKey, page, from }: PageRequest) => {
        const isOlderHistoryRequest = from !== undefined;

        return dispatch(
            fetchTransactionsPageThunk({
                accountKey,
                page,
                perPage,
                forceRefetch: isOlderHistoryRequest,
                from,
            }),
        )
            .unwrap()
            .then(
                result => {
                    setFetchedPageByAccount(previous => ({ ...previous, [accountKey]: page }));
                    const isEmptyPage =
                        result !== 'ALREADY_FETCHED' && !result.history.transactions?.length;
                    const hasHistoryEnded = isEmptyPage && !isOlderHistoryRequest;
                    setExhaustedAccountKeys(previous =>
                        hasHistoryEnded
                            ? addAccountKey(previous, accountKey)
                            : removeAccountKey(previous, accountKey),
                    );
                },
                () => setFailedAccountKeys(previous => addAccountKey(previous, accountKey)),
            );
    };

    const fetchAccountPageBatch = async (pageRequests: readonly PageRequest[]) => {
        setIsFetching(true);
        await Promise.all(pageRequests.map(fetchAccountPage));
        setIsFetching(false);
    };

    const retryFailed = () => setFailedAccountKeys(NO_ACCOUNT_KEYS);

    const reopenHistories = () => {
        setExhaustedAccountKeys(NO_ACCOUNT_KEYS);
        setFailedAccountKeys(NO_ACCOUNT_KEYS);
    };

    return {
        fetchedPageByAccount,
        exhaustedAccountKeys,
        failedAccountKeys,
        isFetching,
        fetchAccountPageBatch,
        retryFailed,
        reopenHistories,
    };
};
