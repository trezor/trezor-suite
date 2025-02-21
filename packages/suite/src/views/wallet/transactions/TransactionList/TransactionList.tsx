import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import useDebounce from 'react-use/lib/useDebounce';

import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    advancedSearchTransactions,
    groupTransactionsByDate,
    isPending,
} from '@suite-common/wallet-utils';
import { SkeletonStack } from '@trezor/components';
import { arrayPartition } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite';
import { Pagination } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { Account, WalletAccountTransaction } from 'src/types/wallet';
import { findAnchorTransactionPage } from 'src/utils/suite/anchor';

import { NoSearchResults } from './NoSearchResults';
import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { TransactionCandidates } from './TransactionCandidates';
import { TransactionGroupedList } from './TransactionGroupedList';
import { TransactionListActions } from './TransactionListActions/TransactionListActions';
import { PendingGroupHeader } from './TransactionsGroup/PendingGroupHeader';
import { useFetchTransactions } from './useFetchTransactions';

interface TransactionListProps {
    allTransactions: WalletAccountTransaction[];
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
    isPagingLimited?: boolean;
    customTotalItems?: number;
    customNoTransactions?: ReactNode;
    isExportable?: boolean;
    customPageFetching?: boolean;
    onPageRequested?: (page: number) => void;
}

export const TransactionList = ({
    allTransactions,
    transactions,
    isLoading,
    account,
    symbol,
    isPagingLimited,
    customNoTransactions,
    customTotalItems,
    onPageRequested,
    isExportable = true,
    customPageFetching,
}: TransactionListProps) => {
    const anchor = useSelector(state => state.router.anchor);
    const dispatch = useDispatch();
    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, account.key));

    const { fetchPage, fetchedAll, fetchAll } = useFetchTransactions(account, allTransactions);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedTransactions, setSearchedTransactions] = useState(transactions);

    const sectionRef = useRef<HTMLDivElement>(null);

    useDebounce(
        () => {
            const results = advancedSearchTransactions(transactions, accountMetadata, searchQuery);
            setSearchedTransactions(results);
        },
        200,
        [transactions, account.metadata, searchQuery, accountMetadata],
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

    // if total pages cannot be determined check current page and number of txs (XRP)
    // Edge case: if there is exactly 25 Ripple txs, pagination will be displayed
    const isRipple = account.networkType === 'ripple';
    const isLastRipplePage = isRipple && slicedTransactions.length < perPage;
    const showRipplePagination = !(isLastRipplePage && currentPage === 1);
    const showPagination = isRipple ? showRipplePagination : totalItems > perPage;
    const areTransactionsAvailable = transactions.length > 0 && searchedTransactions.length === 0;

    return (
        <DashboardSection
            ref={sectionRef}
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <TransactionListActions
                    account={account}
                    searchQuery={searchQuery}
                    setSearch={setSearchQuery}
                    setSelectedPage={setSelectedPage}
                    accountMetadata={accountMetadata}
                    isExportable={isExportable}
                />
            }
            data-testid="@wallet/accounts/transaction-list"
        >
            {account.accountType === 'coinjoin' && !isSearching && (
                <TransactionCandidates accountKey={account.key} />
            )}

            {/* TODO: show this skeleton also while searching in txs */}
            {isLoading ? (
                <SkeletonStack $col $childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </SkeletonStack>
            ) : (
                <>
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
                </>
            )}

            {showPagination && (
                <Pagination
                    isPageListLimited={Boolean(isPagingLimited)}
                    hasPages={!isRipple}
                    currentPage={currentPage}
                    isLastPage={isLastRipplePage}
                    perPage={perPage}
                    totalItems={totalItems}
                    onPageSelected={onPageSelected}
                />
            )}
        </DashboardSection>
    );
};
