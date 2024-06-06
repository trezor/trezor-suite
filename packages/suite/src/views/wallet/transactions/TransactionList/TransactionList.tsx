import { FC, useMemo, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import useDebounce from 'react-use/lib/useDebounce';

import { fetchTransactionsThunk } from '@suite-common/wallet-core';
import {
    advancedSearchTransactions,
    getAccountNetwork,
    GroupedTransactionsByDate,
    groupJointTransactions,
    groupTransactionsByDate,
    isPending,
} from '@suite-common/wallet-utils';
import { CoinjoinBatchItem } from 'src/components/wallet/TransactionItem/CoinjoinBatchItem';
import { Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { WalletAccountTransaction, Account } from 'src/types/wallet';
import { TransactionListActions } from './TransactionListActions/TransactionListActions';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { Pagination } from 'src/components/wallet';
import { TransactionsGroup } from './TransactionsGroup/TransactionsGroup';
import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { NoSearchResults } from './NoSearchResults';
import { findAnchorTransactionPage } from 'src/utils/suite/anchor';
import { TransactionCandidates } from './TransactionCandidates';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { SkeletonStack } from '@trezor/components';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { PendingGroupHeader } from './TransactionsGroup/DayHeader';

const StyledSection = styled(DashboardSection)`
    margin-bottom: 20px;
`;

const PaginationWrapper = styled.div`
    margin-top: 20px;
`;

interface TransactionGroupedListProps {
    transactionGroups: GroupedTransactionsByDate;
    symbol: WalletAccountTransaction['symbol'];
    account: Account;
    isPending: boolean;
}

const TransactionGroupedList: FC<TransactionGroupedListProps> = ({
    transactionGroups,
    symbol,
    account,
    isPending,
}) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, account.key));
    const network = getAccountNetwork(account);

    return Object.entries(transactionGroups).map(([dateKey, value], groupIndex) => (
        <TransactionsGroup
            key={dateKey}
            dateKey={dateKey}
            symbol={symbol}
            transactions={value}
            localCurrency={localCurrency}
            index={groupIndex}
        >
            {groupJointTransactions(value).map((item, index) =>
                item.type === 'joint-batch' ? (
                    <CoinjoinBatchItem
                        key={item.rounds[0].txid}
                        transactions={item.rounds}
                        isPending={isPending}
                        localCurrency={localCurrency}
                    />
                ) : (
                    <TransactionItem
                        key={item.tx.txid}
                        transaction={item.tx}
                        isPending={isPending}
                        accountMetadata={accountMetadata}
                        accountKey={account.key}
                        network={network!}
                        index={index}
                    />
                ),
            )}
        </TransactionsGroup>
    ));
};

interface TransactionListProps {
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
    customTotalItems?: number;
    isExportable?: boolean;
}

export const TransactionList = ({
    transactions,
    isLoading,
    account,
    symbol,
    customTotalItems,
    isExportable = true,
}: TransactionListProps) => {
    const anchor = useSelector(state => state.router.anchor);
    const dispatch = useDispatch();
    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, account.key));

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedTransactions, setSearchedTransactions] = useState(transactions);
    const [hasFetchedAll, setHasFetchedAll] = useState(false);

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
        if (anchor && !hasFetchedAll) {
            dispatch(
                fetchTransactionsThunk({
                    accountKey: account.key,
                    page: 2,
                    perPage: getTxsPerPage(account.networkType),
                    noLoading: true,
                    recursive: true,
                }),
            );
            setHasFetchedAll(true);
        }
    }, [anchor, account, dispatch, hasFetchedAll]);

    // Pagination
    const perPage = getTxsPerPage(account.networkType);
    const startPage = findAnchorTransactionPage(transactions, perPage, anchor);
    const [currentPage, setSelectedPage] = useState(startPage);

    useEffect(() => {
        // reset page on account change
        setSelectedPage(startPage);
    }, [account.descriptor, account.symbol, startPage]);

    const isSearching = searchQuery.trim() !== '';
    const defaultTotalItems = customTotalItems ?? account.history.total;
    const totalItems = isSearching ? searchedTransactions.length : defaultTotalItems;

    const onPageSelected = (page: number) => {
        setSelectedPage(page);

        if (!isSearching) {
            dispatch(fetchTransactionsThunk({ accountKey: account.key, page, perPage }));
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

    // TODO use one fn call to split pending & confirmed instead of two filters (use lib fn such as ramda partition)
    const pendingTxs = useMemo(
        () => slicedTransactions.filter(item => isPending(item)),
        [slicedTransactions],
    );
    const confirmedTxs = useMemo(
        () => slicedTransactions.filter(item => !isPending(item)),
        [slicedTransactions],
    );

    const pendingTxsByDate = useMemo(
        () => groupTransactionsByDate(pendingTxs, 'day', true),
        [pendingTxs],
    );
    const confirmedTxsByDate = useMemo(
        () => groupTransactionsByDate(confirmedTxs, 'day', true),
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
        <StyledSection
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
            data-test="@wallet/accounts/transaction-list"
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
                    {areTransactionsAvailable ? (
                        <NoSearchResults />
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
                    )}
                </>
            )}

            {showPagination && (
                <PaginationWrapper>
                    <Pagination
                        hasPages={!isRipple}
                        currentPage={currentPage}
                        isLastPage={isLastRipplePage}
                        perPage={perPage}
                        totalItems={totalItems}
                        onPageSelected={onPageSelected}
                    />
                </PaginationWrapper>
            )}
        </StyledSection>
    );
};
