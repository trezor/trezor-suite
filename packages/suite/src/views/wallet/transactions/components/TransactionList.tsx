import React, { useMemo, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import useDebounce from 'react-use/lib/useDebounce';

import { Stack } from '@suite-components/Skeleton';
import { Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import { useSelector, useActions } from '@suite-hooks';
import {
    groupTransactionsByDate,
    advancedSearchTransactions,
    groupJointTransactions,
    getAccountNetwork,
} from '@suite-common/wallet-utils';
import { SETTINGS } from '@suite-config';
import { WalletAccountTransaction, Account } from '@wallet-types';
import { TransactionListActions } from './TransactionListActions';
import TransactionItem from '@wallet-components/TransactionItem';
import { Pagination } from '@wallet-components';
import { TransactionsGroup } from './TransactionsGroup';
import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { NoSearchResults } from './NoSearchResults';
import { findAnchorTransactionPage } from '@suite-utils/anchor';
import { fetchTransactionsThunk } from '@suite-common/wallet-core';
import { CoinjoinBatchItem } from '@wallet-components/TransactionItem/components/CoinjoinBatchItem';
import { TransactionCandidates } from './TransactionCandidates';

const StyledSection = styled(Section)`
    margin-bottom: 20px;
`;

const PaginationWrapper = styled.div`
    margin-top: 20px;
`;

interface TransactionListProps {
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
}

export const TransactionList = ({
    transactions,
    isLoading,
    account,
    symbol,
}: TransactionListProps) => {
    const { anchor, localCurrency } = useSelector(state => ({
        localCurrency: state.wallet.settings.localCurrency,
        anchor: state.router.anchor,
    }));

    const network = getAccountNetwork(account);

    // Search
    const [search, setSearch] = useState('');
    const [searchedTransactions, setSearchedTransactions] = useState(transactions);
    const [hasFetchedAll, setHasFetchedAll] = useState(false);

    const { fetchTransactions } = useActions({
        fetchTransactions: fetchTransactionsThunk,
    });

    const sectionRef = useRef<HTMLDivElement>(null);

    useDebounce(
        () => {
            const results = advancedSearchTransactions(transactions, account.metadata, search);
            setSearchedTransactions(results);
        },
        200,
        [transactions, account.metadata, search],
    );

    useEffect(() => {
        if (anchor && !hasFetchedAll) {
            fetchTransactions({
                accountKey: account.key,
                page: 2,
                perPage: SETTINGS.TXS_PER_PAGE,
                noLoading: true,
                recursive: true,
            });
            setHasFetchedAll(true);
        }
    }, [anchor, fetchTransactions, account, hasFetchedAll]);

    // Pagination
    const perPage = SETTINGS.TXS_PER_PAGE;
    const startPage = findAnchorTransactionPage(transactions, perPage, anchor);
    const [currentPage, setSelectedPage] = useState(startPage);

    useEffect(() => {
        // reset page on account change
        setSelectedPage(startPage);
    }, [account.descriptor, account.symbol, startPage]);

    const isSearching = search !== '';
    const totalItems = isSearching ? searchedTransactions.length : account.history.total;

    const onPageSelected = (page: number) => {
        setSelectedPage(page);

        if (!isSearching) {
            fetchTransactions({ accountKey: account.key, page, perPage });
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

    const transactionsByDate = useMemo(
        () => groupTransactionsByDate(slicedTransactions),
        [slicedTransactions],
    );

    const listItems = useMemo(
        () =>
            Object.entries(transactionsByDate).map(([dateKey, value], groupIndex) => {
                const isPending = dateKey === 'pending';

                return (
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
                                    accountMetadata={account.metadata}
                                    accountKey={account.key}
                                    network={network!}
                                    index={index}
                                />
                            ),
                        )}
                    </TransactionsGroup>
                );
            }),
        [transactionsByDate, account.key, account.metadata, localCurrency, symbol, network],
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
                    search={search}
                    setSearch={setSearch}
                    setSelectedPage={setSelectedPage}
                />
            }
            data-test="@wallet/accounts/transaction-list"
        >
            {account.accountType === 'coinjoin' && (
                <TransactionCandidates accountKey={account.key} />
            )}

            {/* TODO: show this skeleton also while searching in txs */}
            {isLoading ? (
                <Stack col childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </Stack>
            ) : (
                <>{areTransactionsAvailable ? <NoSearchResults /> : listItems}</>
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
