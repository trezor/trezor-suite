import { useMemo, useRef, useState } from 'react';
import { useDebounce } from 'react-use';

import { DebugOnlyBadge } from '@suite/debug';
import { Translation } from '@suite/intl';
import {
    type StoredAccountTransactions,
    toTransactionSearch,
    useStoredAccountTransactions,
} from '@suite/transaction-store';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    hasNetworkPotentialFraudTransactions,
    isPhishingTransaction,
} from '@suite-common/token-definitions';
import type { SuspiciousTransactionsContext } from '@suite-common/transaction-store';
import {
    selectAccountTransactions,
    selectActiveDustPhishingThreshold,
    selectIsHideSuspiciousTransactions,
    selectPhishingTransactionsContext,
} from '@suite-common/wallet-core';
import { groupTransactionsByDate, isPending } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { Pagination } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { selectAccountLabelsForSearch } from 'src/selectors/suite/selectAccountLabelsForSearch';
import { type Account } from 'src/types/wallet';

import { NoSearchResults } from './NoSearchResults';
import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { TransactionGroupedList } from './TransactionGroupedList';
import { TransactionListActions } from './TransactionListActions/TransactionListActions';
import { PendingGroupHeader } from './TransactionsGroup/PendingGroupHeader';

const SEARCH_DEBOUNCE_MS = 200;

const describeSyncStatus = (
    { syncStatus, storedCount, isSyncing }: StoredAccountTransactions,
    isSearching: boolean,
) => {
    const history = syncStatus?.isComplete ? 'whole history' : 'newest part of the history';
    const activity = isSyncing ? 'syncing' : 'up to date';
    const error = syncStatus?.lastError ? ` · last sync failed: ${syncStatus.lastError}` : '';
    const count = isSearching ? `${storedCount} matching` : `${storedCount} stored`;

    return `Transaction store: ${activity} · ${count} (${history})${error}`;
};

type StoredTransactionListProps = {
    account: Account;
};

/**
 * What the store needs to hide suspicious transactions when the user chose to, or `undefined`.
 * The store detects most of it in SQL; dust needs historic fiat rates, which only the app has,
 * so the app's own detection flags those among the transactions Redux holds.
 */
const useHideSuspicious = (account: Account): SuspiciousTransactionsContext | undefined => {
    const isHiding = useSelector(state =>
        selectIsHideSuspiciousTransactions(state, account.symbol),
    );
    const { tokenDefinitions, txsMarkedAsNotScam, historicRates } = useSelector(state =>
        selectPhishingTransactionsContext(state, account.key, account.symbol),
    );
    const dustThreshold = useSelector(selectActiveDustPhishingThreshold);
    const reduxTransactions = useSelector(state => selectAccountTransactions(state, account.key));

    return useMemo(() => {
        if (!isHiding || !hasNetworkPotentialFraudTransactions(account.symbol)) return undefined;

        return {
            notScamTxids: txsMarkedAsNotScam,
            flaggedTxids: reduxTransactions
                .filter(
                    transaction =>
                        isPhishingTransaction({
                            transaction,
                            tokenDefinitions,
                            txsMarkedAsNotScam,
                            historicRates,
                            dustThreshold,
                        }).isPhishing,
                )
                .map(({ txid }) => txid),
        };
    }, [
        isHiding,
        account.symbol,
        reduxTransactions,
        tokenDefinitions,
        txsMarkedAsNotScam,
        historicRates,
        dustThreshold,
    ]);
};

/**
 * The account's history read from the transaction store instead of Redux; shown in debug mode.
 * Paging past what is stored asks the store for the whole history, which its worker fetches.
 * The search runs in the worker over everything stored, with the syntax of the Redux list.
 */
export const StoredTransactionList = ({ account }: StoredTransactionListProps) => {
    const perPage = getTxsPerPage(account.networkType);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const sectionRef = useRef<HTMLDivElement>(null);
    const labels = useSelector(state => selectAccountLabelsForSearch(state, account));

    useDebounce(() => setDebouncedSearchQuery(searchQuery), SEARCH_DEBOUNCE_MS, [searchQuery]);

    const search = useMemo(
        () =>
            toTransactionSearch({ query: debouncedSearchQuery, symbol: account.symbol, labels }) ??
            undefined,
        [debouncedSearchQuery, account.symbol, labels],
    );
    const isSearching = search !== undefined;
    const hideSuspicious = useHideSuspicious(account);
    const storedTransactions = useStoredAccountTransactions({
        account,
        page,
        perPage,
        search,
        hideSuspicious,
    });
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

        if (!isSearching && !isComplete && selectedPage * perPage >= storedCount) {
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
            actions={
                <TransactionListActions
                    account={account}
                    searchQuery={searchQuery}
                    setSearch={setSearchQuery}
                    setSelectedPage={setPage}
                    // Export reads the Redux history; the store has no export yet.
                    isExportable={false}
                />
            }
            data-testid="@wallet/accounts/stored-transaction-list"
        >
            <Column gap={32} padding={{ top: 16 }}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {describeSyncStatus(storedTransactions, isSearching)}
                </Text>
                {isLoading ? (
                    <Column gap={16}>
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                    </Column>
                ) : (
                    <Column gap={40}>
                        {isSearching && transactions.length === 0 && <NoSearchResults />}
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
                {(storedCount > perPage || (!isComplete && !isSearching)) && (
                    <Pagination
                        currentPage={page}
                        perPage={perPage}
                        totalItems={storedCount}
                        // Older history is still to come while the store does not hold all of it;
                        // a search covers only what is stored.
                        noUpperBound={!isComplete && !isSearching}
                        onPageSelected={onPageSelected}
                        explicitNavigation
                    />
                )}
            </Column>
        </DashboardSection>
    );
};
