import { useMemo, useRef, useState } from 'react';
import { useDebounce } from 'react-use';

import { DebugOnlyBadge } from '@suite/debug';
import { Translation } from '@suite/intl';
import {
    injectEnsureTransactionStore,
    selectTransactionStoreHideSuspicious,
    toTransactionSearch,
    useTransactionStoreQuery,
} from '@suite/transaction-store';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    type TransactionStoreRow,
    createTransactionStoreQuery,
    getAccountTransactionsQuery,
} from '@suite-common/transaction-store';
import { enhanceTransaction, groupTransactionsByDate, isPending } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

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

const getSyncStateQuery = (accountKey: string) =>
    createTransactionStoreQuery(db =>
        db
            .selectFrom('sync_state')
            .select(['is_syncing', 'is_complete', 'last_synced_at', 'last_error'])
            .where('account_key', '=', accountKey),
    );

type SyncState = TransactionStoreRow<ReturnType<typeof getSyncStateQuery>>;

const describeSyncStatus = (
    syncState: SyncState | undefined,
    storedCount: number,
    isSearching: boolean,
) => {
    const history = syncState?.is_complete === 1 ? 'whole history' : 'newest part of the history';
    const activity = syncState?.is_syncing === 1 ? 'syncing' : 'up to date';
    const error = syncState?.last_error ? ` · last sync failed: ${syncState.last_error}` : '';
    const count = isSearching ? `${storedCount} matching` : `${storedCount} stored`;

    return `Transaction store: ${activity} · ${count} (${history})${error}`;
};

type StoredTransactionListProps = {
    account: Account;
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
    const hideSuspicious = useSelector(state =>
        selectTransactionStoreHideSuspicious(state, account.key, account.symbol),
    );
    const { ensureTransactionStore } = useServices(injectEnsureTransactionStore);

    const queries = useMemo(() => {
        const filter = { accountKey: account.key, symbol: account.symbol, search, hideSuspicious };

        return {
            page: createTransactionStoreQuery(
                () =>
                    getAccountTransactionsQuery(filter)
                        .select('t.data')
                        // Pending first, then the newest.
                        .orderBy(eb => eb('t.block_height', 'is', null), 'desc')
                        .orderBy('t.block_time', 'desc')
                        .orderBy('t.txid')
                        .limit(perPage)
                        .offset((page - 1) * perPage),
                // Asking for the account's rows is what downloads its history.
                { accountKeys: [account.key] },
            ),
            count: createTransactionStoreQuery(() =>
                getAccountTransactionsQuery(filter).select(eb =>
                    eb.fn.countAll<number>().as('count'),
                ),
            ),
            syncState: getSyncStateQuery(account.key),
        };
    }, [account.key, account.symbol, search, hideSuspicious, page, perPage]);

    const rows = useTransactionStoreQuery(queries.page);
    const storedCount = useTransactionStoreQuery(queries.count)?.[0]?.count ?? 0;
    const syncState = useTransactionStoreQuery(queries.syncState)?.[0];
    const transactions = useMemo(
        () => (rows ?? []).map(row => enhanceTransaction(JSON.parse(row.data), account)),
        [rows, account],
    );
    const isComplete = syncState?.is_complete === 1;
    // Nothing to show until the first sync brought something or failed.
    const isLoading =
        rows === undefined ||
        (transactions.length === 0 &&
            (syncState === undefined ||
                (syncState.last_synced_at === null && syncState.last_error === null)));

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
            void ensureTransactionStore().transactionStore.requestFullHistory(account.key);
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
                    {describeSyncStatus(syncState, storedCount, isSearching)}
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
