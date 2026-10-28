import { useMemo, useRef, useState } from 'react';

import { DebugOnlyBadge } from '@suite/debug';
import { Translation } from '@suite/intl';
import {
    type StoredAccountTransactions,
    useStoredAccountTransactions,
} from '@suite/transaction-store';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { groupTransactionsByDate, isPending } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { Pagination } from 'src/components/wallet';
import { type Account } from 'src/types/wallet';

import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { TransactionGroupedList } from './TransactionGroupedList';
import { PendingGroupHeader } from './TransactionsGroup/PendingGroupHeader';

const describeSyncStatus = ({ syncStatus, storedCount, isSyncing }: StoredAccountTransactions) => {
    const history = syncStatus?.isComplete ? 'whole history' : 'newest part of the history';
    const activity = isSyncing ? 'syncing' : 'up to date';
    const error = syncStatus?.lastError ? ` · last sync failed: ${syncStatus.lastError}` : '';

    return `Transaction store: ${activity} · ${storedCount} stored (${history})${error}`;
};

type StoredTransactionListProps = {
    account: Account;
};

/**
 * The account's history read from the transaction store instead of Redux; shown in debug mode.
 * Paging past what is stored asks the store for the whole history, which its worker fetches.
 */
export const StoredTransactionList = ({ account }: StoredTransactionListProps) => {
    const perPage = getTxsPerPage(account.networkType);
    const [page, setPage] = useState(1);
    const sectionRef = useRef<HTMLDivElement>(null);
    const storedTransactions = useStoredAccountTransactions({ account, page, perPage });
    const { transactions, storedCount, syncStatus, isLoading, requestFullHistory } =
        storedTransactions;
    const isComplete = syncStatus?.isComplete ?? false;

    const pendingTxsByDate = useMemo(
        () => groupTransactionsByDate(transactions.filter(isPending), 'day'),
        [transactions],
    );
    const confirmedTxs = useMemo(() => transactions.filter(tx => !isPending(tx)), [transactions]);
    const confirmedTxsByDate = useMemo(
        () => groupTransactionsByDate(confirmedTxs, 'day'),
        [confirmedTxs],
    );
    const pendingCount = transactions.length - confirmedTxs.length;

    const onPageSelected = (selectedPage: number) => {
        setPage(selectedPage);
        sectionRef.current?.scrollIntoView();

        if (!isComplete && selectedPage * perPage >= storedCount) {
            requestFullHistory();
        }
    };

    return (
        <DashboardSection
            ref={sectionRef}
            heading={
                <DebugOnlyBadge>
                    <Translation id="TR_ALL_TRANSACTIONS" />
                </DebugOnlyBadge>
            }
            data-testid="@wallet/accounts/stored-transaction-list"
        >
            <Column gap={32} padding={{ top: 16 }}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {describeSyncStatus(storedTransactions)}
                </Text>
                {isLoading ? (
                    <Column gap={16}>
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                    </Column>
                ) : (
                    <Column gap={40}>
                        {pendingCount > 0 && <PendingGroupHeader txsCount={pendingCount} />}
                        <TransactionGroupedList
                            transactionGroups={pendingTxsByDate}
                            symbol={account.symbol}
                            account={account}
                            isPending
                        />
                        <TransactionGroupedList
                            transactionGroups={confirmedTxsByDate}
                            symbol={account.symbol}
                            account={account}
                            isPending={false}
                        />
                    </Column>
                )}
                {(storedCount > perPage || !isComplete) && (
                    <Pagination
                        currentPage={page}
                        perPage={perPage}
                        totalItems={storedCount}
                        // Older history is still to come while the store does not hold all of it.
                        noUpperBound={!isComplete}
                        onPageSelected={onPageSelected}
                        explicitNavigation
                    />
                )}
            </Column>
        </DashboardSection>
    );
};
