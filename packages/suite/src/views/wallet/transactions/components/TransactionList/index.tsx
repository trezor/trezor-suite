import React, { useMemo, useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Stack } from '@suite-components/Skeleton';
import { Card } from '@trezor/components';
import { Translation } from '@suite-components';
import { AccountExceptionLayout } from '@wallet-components';
import { Section } from '@dashboard-components';
import { useSelector, useActions } from '@suite-hooks';
import * as transactionActions from '@wallet-actions/transactionActions';
import { groupTransactionsByDate, searchTransactions } from '@wallet-utils/transactionUtils';
import { SETTINGS } from '@suite-config';
import { WalletAccountTransaction, Account } from '@wallet-types';

import Actions from './components/Actions';
import TransactionItem from './components/TransactionItem';
import Pagination from './components/Pagination';
import TransactionsGroup from './components/TransactionsGroup';
import SkeletonTransactionItem from './components/SkeletonTransactionItem';

const StyledCard = styled(Card)<{ isPending: boolean }>`
    flex-direction: column;
    padding: 0px 24px;
    ${props =>
        props.isPending &&
        css`
            border-left: 6px solid ${props => props.theme.TYPE_ORANGE};
            padding-left: 18px;
        `}
`;

const StyledSection = styled(Section)`
    margin-bottom: 20px;
`;

const PaginationWrapper = styled.div`
    margin-top: 20px;
`;

interface Props {
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
}

const TransactionList = ({ transactions, isLoading, account, ...props }: Props) => {
    const ref = React.createRef<HTMLDivElement>();
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const { fetchTransactions } = useActions({
        fetchTransactions: transactionActions.fetchTransactions,
    });

    // Search
    const [search, setSearch] = useState('');
    const isSearching = search !== '';
    const fitleredTransactions = useMemo(() => searchTransactions(transactions, search), [
        transactions,
        search,
    ]);

    // Pagination
    const perPage = SETTINGS.TXS_PER_PAGE;
    const [currentPage, setSelectedPage] = useState(1);
    useEffect(() => {
        // reset page on account change
        setSelectedPage(1);
    }, [account.descriptor, account.symbol]);

    const { size = undefined, total = undefined } = isSearching
        ? {
              size: perPage,
              total: Math.ceil(fitleredTransactions.length / perPage),
          }
        : account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);

        if (!isSearching) {
            fetchTransactions(account, page, size);
        }

        if (ref.current) {
            ref.current.scrollIntoView();
        }
    };

    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;

    const slicedTransactions = useMemo(() => fitleredTransactions.slice(startIndex, stopIndex), [
        fitleredTransactions,
        startIndex,
        stopIndex,
    ]);

    const transactionsByDate = useMemo(() => groupTransactionsByDate(slicedTransactions), [
        slicedTransactions,
    ]);

    // if totalPages is 1 do not render pagination
    // if totalPages is undefined check current page and number of txs (e.g. XRP)
    // Edge case: if there is exactly 25 txs, pagination will be displayed
    const isOnLastPage = slicedTransactions.length < SETTINGS.TXS_PER_PAGE;
    const shouldShowRipplePagination = !(currentPage === 1 && isOnLastPage);
    const showPagination = total ? total > 1 : shouldShowRipplePagination;

    return (
        <StyledSection
            ref={ref}
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <Actions
                    account={account}
                    search={search}
                    setSearch={setSearch}
                    setSelectedPage={setSelectedPage}
                />
            }
        >
            {isLoading ? (
                <Stack col childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </Stack>
            ) : (
                <>
                    {transactions.length > 0 && fitleredTransactions.length === 0 ? (
                        <AccountExceptionLayout
                            title={<Translation id="TR_NO_SEARCH_RESULTS" />}
                            image="UNI_WARNING"
                        />
                    ) : (
                        Object.keys(transactionsByDate).map(dateKey => {
                            const isPending = dateKey === 'pending';
                            return (
                                <TransactionsGroup
                                    key={dateKey}
                                    dateKey={dateKey}
                                    symbol={props.symbol}
                                    transactions={transactionsByDate[dateKey]}
                                    localCurrency={localCurrency}
                                >
                                    <StyledCard isPending={isPending}>
                                        {transactionsByDate[dateKey].map(
                                            (tx: WalletAccountTransaction) => (
                                                <TransactionItem
                                                    key={tx.txid}
                                                    transaction={tx}
                                                    isPending={isPending}
                                                    accountMetadata={account.metadata}
                                                    accountKey={account.key}
                                                />
                                            ),
                                        )}
                                    </StyledCard>
                                </TransactionsGroup>
                            );
                        })
                    )}
                </>
            )}
            {showPagination && (
                <PaginationWrapper>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={total}
                        isOnLastPage={isOnLastPage}
                        onPageSelected={onPageSelected}
                    />
                </PaginationWrapper>
            )}
        </StyledSection>
    );
};

export default TransactionList;
