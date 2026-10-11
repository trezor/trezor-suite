import { useState } from 'react';

import { Translation } from '@suite/intl';
import { injectDispatch } from '@suite-common/redux-utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { fetchTransactionsPageThunk } from '@suite-common/wallet-core';
import { getOlderHistoryFrom } from '@suite-common/wallet-utils';
import { Button, Column, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { FormattedDate } from 'src/components/suite';
import { type Account } from 'src/types/wallet';

import SkeletonTransactionItem from './SkeletonTransactionItem';

interface LoadOlderHistoryProps {
    account: Account;
    /** How many transactions the list already holds, including not-yet-filled page slots. */
    loadedCount: number;
}

/**
 * A direct-RPC backend cannot enumerate an address's whole history, so it scans a window of blocks
 * and reports where that window ends. Everything older stays unreachable until someone asks for it,
 * which is what this does - one step further back per press.
 */
export const LoadOlderHistory = ({ account, loadedCount }: LoadOlderHistoryProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);

    const from = getOlderHistoryFrom(account);

    if (from === undefined) return null;

    const handleClick = async () => {
        const perPage = getTxsPerPage(account.networkType);
        setIsLoading(true);
        setHasFailed(false);
        try {
            // `from` widens the backend's window and the page starting where the list ends comes
            // back in the same request. `noLoading` keeps the loaded transactions on screen; only
            // the incoming page gets skeletons, and the thunk stores it before it resolves.
            await dispatch(
                fetchTransactionsPageThunk({
                    accountKey: account.key,
                    page: Math.floor(loadedCount / perPage) + 1,
                    perPage,
                    forceRefetch: true,
                    noLoading: true,
                    from,
                }),
            ).unwrap();
        } catch {
            setHasFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    // A step can find nothing, so the date the list reaches back to is what shows the press worked.
    const coveredSince =
        account.networkType === 'ethereum' ? account.misc.historyCoveredSince : undefined;

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
