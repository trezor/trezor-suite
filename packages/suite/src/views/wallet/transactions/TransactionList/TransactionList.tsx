import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import useDebounce from 'react-use/lib/useDebounce';

import { Translation } from '@suite/intl';
import { findAnchorTransactionPage, selectRouterAnchor } from '@suite/router';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { advancedSearchTransactions } from '@suite-common/transaction-search';
import { groupTransactionsByDate, isPending } from '@suite-common/wallet-utils';
import { Column, SkeletonStack } from '@trezor/components';
import { arrayPartition } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { Pagination } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAccountLabelsForSearch } from 'src/selectors/suite/selectAccountLabelsForSearch';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { NoSearchResults } from './NoSearchResults';
import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { TransactionGroupedList } from './TransactionGroupedList';
import { FilterChips } from './TransactionListActions/FilterChips';
import {
    TransactionListActions,
    type TransactionListActionsRef,
} from './TransactionListActions/TransactionListActions';
import {
    applyNonTextFilters,
    useTransactionFilters,
} from './TransactionListActions/useTransactionFilters';
import { PendingGroupHeader } from './TransactionsGroup/PendingGroupHeader';
import { useFetchTransactions } from './useFetchTransactions';

interface TransactionListProps {
    allTransactions: WalletAccountTransaction[];
    areAllTransactionsLoaded: boolean;
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
    customTotalItems?: number;
    customNoTransactions?: ReactNode;
    isExportable?: boolean;
    isTxFilteringEnabled?: boolean;
    customPageFetching?: boolean;
    onPageRequested?: (page: number) => void;
}

export const TransactionList = ({
    allTransactions,
    areAllTransactionsLoaded,
    transactions,
    isLoading,
    account,
    symbol,
    customNoTransactions,
    customTotalItems,
    onPageRequested,
    isExportable = true,
    isTxFilteringEnabled = true,
    customPageFetching,
}: TransactionListProps) => {
    const anchor = useSelector(selectRouterAnchor);
    const dispatch = useDispatch();
    const searchLabels = useSelector(state => selectAccountLabelsForSearch(state, account));

    const { fetchPage, fetchedAll, fetchAll } = useFetchTransactions(account, allTransactions);

    // Search & filters
    const {
        conditions,
        logics,
        fulltext,
        setFulltext,
        addCondition,
        updateCondition,
        removeCondition,
        toggleLogic,
        clearConditions,
        searchQuery,
    } = useTransactionFilters();

    const [searchedTransactions, setSearchedTransactions] = useState(transactions);

    const sectionRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<TransactionListActionsRef>(null);

    useDebounce(
        () => {
            const preFiltered = applyNonTextFilters(transactions, conditions);
            const results = advancedSearchTransactions(preFiltered, searchLabels, searchQuery);
            setSearchedTransactions(results);
        },
        200,
        [transactions, conditions, searchQuery, searchLabels],
    );

    useEffect(() => {
        if (anchor && !fetchedAll) {
            fetchAll();
        }
    }, [anchor, account, dispatch, fetchedAll, fetchAll]);

    // Pagination
    const perPage = getTxsPerPage(account.networkType);
    // NOTE: if there is no anchor, we can keep the page 1
    const startPage = useMemo(
        () => (anchor ? findAnchorTransactionPage(transactions, perPage, anchor) : null),
        [anchor, perPage, transactions],
    );
    const [currentPage, setSelectedPage] = useState(startPage ?? 1);

    useEffect(() => {
        // reset page on account change
        if (startPage === null) return;
        setSelectedPage(startPage);
        onPageRequested?.(startPage);
    }, [account.descriptor, account.symbol, onPageRequested, startPage]);

    const isSearching = searchQuery.trim() !== '';
    const defaultTotalItems = customTotalItems ?? account.history.total;
    const totalItems = isSearching ? searchedTransactions.length : defaultTotalItems;

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        onPageRequested?.(page);

        if (!isSearching && !customPageFetching) {
            fetchPage(page);
        }

        if (sectionRef.current) {
            sectionRef.current.scrollIntoView();
        }
    };

    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;

    const slicedTransactions = useMemo(
        () => searchedTransactions.slice(startIndex, stopIndex),
        [searchedTransactions, startIndex, stopIndex],
    );

    const [pendingTxs, confirmedTxs] = useMemo(
        () => arrayPartition(slicedTransactions, isPending),
        [slicedTransactions],
    );

    const pendingTxsByDate = useMemo(
        () => groupTransactionsByDate(pendingTxs, 'day'),
        [pendingTxs],
    );
    const confirmedTxsByDate = useMemo(
        () => groupTransactionsByDate(confirmedTxs, 'day'),
        [confirmedTxs],
    );

    // if total pages cannot be determined check current page and number of txs (XRP/XLM)
    // Edge case: if there is exactly 25 Ripple/Stellar txs, pagination will be displayed
    const isRippleOrStellar = account.networkType === 'ripple' || account.networkType === 'stellar';
    const isLastRippleOrStellarPage = isRippleOrStellar && slicedTransactions.length < perPage;
    const showRippleOrStellarPagination = !(isLastRippleOrStellarPage && currentPage === 1);
    const showPagination = isRippleOrStellar ? showRippleOrStellarPagination : totalItems > perPage;

    const areTransactionsAvailable = transactions.length > 0 && searchedTransactions.length === 0;

    return (
        <DashboardSection
            ref={sectionRef}
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <TransactionListActions
                    ref={actionsRef}
                    account={account}
                    searchQuery={fulltext}
                    setSearch={setFulltext}
                    setSelectedPage={setSelectedPage}
                    isExportable={isExportable}
                    isTxFilteringEnabled={isTxFilteringEnabled}
                    conditions={conditions}
                    logics={logics}
                    onAddCondition={addCondition}
                    onUpdateCondition={updateCondition}
                    onClearConditions={clearConditions}
                />
            }
            data-testid="@wallet/accounts/transaction-list"
        >
            {conditions.length > 0 && (
                <FilterChips
                    conditions={conditions}
                    logics={logics}
                    onRemove={removeCondition}
                    onToggleLogic={toggleLogic}
                    onEditCondition={id => actionsRef.current?.editCondition(id)}
                />
            )}
            <Column gap={32} padding={{ top: 16 }}>
                {/* TODO: show this skeleton also while searching in txs */}
                {isLoading ||
                (!areAllTransactionsLoaded && searchQuery && searchedTransactions.length === 0) ? (
                    <SkeletonStack $col $childMargin="0px 0px 16px 0px">
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                    </SkeletonStack>
                ) : (
                    <Column gap={40}>
                        {areTransactionsAvailable && <NoSearchResults />}
                        {!areTransactionsAvailable &&
                            (customNoTransactions &&
                            confirmedTxs.length === 0 &&
                            pendingTxs.length === 0 ? (
                                customNoTransactions
                            ) : (
                                <>
                                    {pendingTxs.length > 0 && (
                                        <PendingGroupHeader txsCount={pendingTxs.length} />
                                    )}
                                    <TransactionGroupedList
                                        transactionGroups={pendingTxsByDate}
                                        symbol={symbol}
                                        account={account}
                                        isPending={true}
                                    />
                                    <TransactionGroupedList
                                        transactionGroups={confirmedTxsByDate}
                                        symbol={symbol}
                                        account={account}
                                        isPending={false}
                                    />
                                </>
                            ))}
                    </Column>
                )}

                {showPagination && (
                    <Pagination
                        hasPages={!isRippleOrStellar}
                        currentPage={currentPage}
                        isLastPage={isLastRippleOrStellarPage}
                        perPage={perPage}
                        totalItems={totalItems}
                        onPageSelected={onPageSelected}
                        explicitNavigation
                    />
                )}
            </Column>
        </DashboardSection>
    );
};
