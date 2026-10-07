import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    type AccountsRootState,
    type TransactionsRootState,
    fetchTransactionsPageThunk,
    selectHistoryCoveredSince,
} from '@suite-common/wallet-core';
import { getOlderHistoryFrom } from '@suite-common/wallet-utils';
import { Button, Column, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { FormattedDate } from '#src/components/suite';
import { type Account } from '#src/types/wallet';

import SkeletonTransactionItem from './SkeletonTransactionItem';
import { selectStoredTransactionCounts } from './selectStoredTransactionCounts';

interface LoadOlderHistoryProps {
    accounts: readonly Account[];
}

/**
 * A direct-RPC backend cannot enumerate an address's whole history, so it scans a window of blocks
 * and reports where that window ends. Everything older stays unreachable until someone asks for it,
 * which is what this does - one step further back per press, for every account that has more.
 */
export const LoadOlderHistory = ({ accounts }: LoadOlderHistoryProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);

    const olderAccounts = accounts.filter(account => getOlderHistoryFrom(account) !== undefined);
    // Including not-yet-filled page slots, so the next page starts where the stored ones end.
    const loadedCounts = useSelector((state: TransactionsRootState) =>
        selectStoredTransactionCounts(state, olderAccounts),
    );
    const coveredSince = useSelector((state: TransactionsRootState & AccountsRootState) => {
        const coveredSinceDates = olderAccounts
            .map(account => selectHistoryCoveredSince(state, account.key))
            .filter(date => date !== undefined);

        return coveredSinceDates.length > 0 ? Math.max(...coveredSinceDates) : undefined;
    });

    if (olderAccounts.length === 0) return null;

    const handleClick = async () => {
        setIsLoading(true);
        setHasFailed(false);
        try {
            // `from` widens the backend's window and the page starting where the list ends comes
            // back in the same request. `noLoading` keeps the loaded transactions on screen; only
            // the incoming page gets skeletons, and the thunk stores it before it resolves.
            await Promise.all(
                olderAccounts.map((account, index) => {
                    const perPage = getTxsPerPage(account.networkType);

                    return dispatch(
                        fetchTransactionsPageThunk({
                            accountKey: account.key,
                            page: Math.floor((loadedCounts[index] ?? 0) / perPage) + 1,
                            perPage,
                            forceRefetch: true,
                            noLoading: true,
                            from: getOlderHistoryFrom(account),
                        }),
                    ).unwrap();
                }),
            );
        } catch {
            setHasFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Column gap={32}>
            {isLoading && (
                <Column gap={16}>
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </Column>
            )}
            <Column alignItems="center" gap={8}>
                {coveredSince !== undefined && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_HISTORY_COVERED_SINCE"
                            values={{
                                date: <FormattedDate value={coveredSince * 1000} date time />,
                            }}
                        />
                    </Text>
                )}
                <Button
                    intent="neutral"
                    priority="secondary"
                    isLoading={isLoading}
                    onClick={handleClick}
                    data-testid="@wallet/accounts/load-older-history"
                >
                    <Translation id="TR_LOAD_OLDER_TRANSACTIONS" />
                </Button>
                {hasFailed && (
                    <Text typographyStyle="body-sm" intent="warning">
                        <Translation id="TR_LOAD_OLDER_TRANSACTIONS_FAILED" />
                    </Text>
                )}
            </Column>
        </Column>
    );
};
