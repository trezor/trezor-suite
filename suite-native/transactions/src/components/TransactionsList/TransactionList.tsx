import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList } from 'react-native';
import { useSelector } from 'react-redux';

import { TokenSymbol, AccountKey } from '@suite-common/wallet-types';
import { groupTransactionsByDate, MonthKey } from '@suite-common/wallet-utils';
import { selectIsLoadingTransactions } from '@suite-common/wallet-core';
import { Loader } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionsEmptyState } from '../TransactionsEmptyState';

type AccountTransactionProps = {
    transactions: WalletAccountTransaction[];
    areTokensIncluded: boolean;
    fetchMoreTransactions: (pageToFetch: number, perPage: number) => void;
    listHeaderComponent: JSX.Element;
    accountKey: string;
    tokenSymbol?: TokenSymbol;
};

type RenderSectionHeaderParams = {
    section: {
        monthKey: MonthKey;
    };
};

type RenderTransactionItemParams = {
    item: WalletAccountTransaction;
    section: { monthKey: MonthKey; data: WalletAccountTransaction[] };
    index: number;
    accountKey: AccountKey;
    areTokensIncluded: boolean;
};

type RenderTokenTranferItemParams = Omit<RenderTransactionItemParams, 'areTokensIncluded'> & {
    tokenSymbol?: TokenSymbol;
};

const sectionListStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.small,
    flex: 1,
}));

const sectionListContainerStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.small,
}));

const renderTransactionItem = ({
    item,
    section,
    index,
    accountKey,
    areTokensIncluded,
}: RenderTransactionItemParams) => (
    <TransactionListItem
        key={item.txid}
        transaction={item}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        accountKey={accountKey}
        areTokensIncluded={areTokensIncluded}
    />
);

const renderTokenTransferItem = ({
    item,
    section,
    index,
    accountKey,
    tokenSymbol,
}: RenderTokenTranferItemParams) => {
    const tokenTransfers = item.tokens.filter(token => token.symbol === tokenSymbol);

    return (
        <>
            {tokenTransfers.map((tokenTransfer, transferIndex) => (
                <TokenTransferListItem
                    key={tokenTransfer.symbol}
                    tokenTransfer={tokenTransfer}
                    txid={item.txid}
                    accountKey={accountKey}
                    isFirst={index === 0 && transferIndex === 0}
                    isLast={
                        index === section.data.length - 1 &&
                        transferIndex === tokenTransfers.length - 1
                    }
                />
            ))}
        </>
    );
};

const renderSectionHeader = ({ section: { monthKey } }: RenderSectionHeaderParams) => (
    <TransactionListGroupTitle key={monthKey} monthKey={monthKey} />
);

export const TX_PER_PAGE = 25;

export const TransactionList = ({
    transactions,
    areTokensIncluded,
    listHeaderComponent,
    fetchMoreTransactions,
    accountKey,
    tokenSymbol,
}: AccountTransactionProps) => {
    const { applyStyle } = useNativeStyles();
    const isLoadingTransactions = useSelector(selectIsLoadingTransactions);
    const accountTransactionsByMonth = useMemo(
        () =>
            groupTransactionsByDate(transactions, 'month') as {
                [key: string]: WalletAccountTransaction[];
                // The typecasting can be removed once the EthereumTokenSymbol is moved
                // to @suite-common scope and the groupTransactionsByDate is retyped to use this type.
            },
        [transactions],
    );

    const transactionMonthKeys = useMemo(
        () => Object.keys(accountTransactionsByMonth) as MonthKey[],
        [accountTransactionsByMonth],
    );
    const initialPageNumber = Math.ceil((transactions.length || 1) / TX_PER_PAGE);
    const [page, setPage] = useState(initialPageNumber);

    useEffect(() => {
        // it's okay to hardcode 1 because this is initial fetch and in case transactions are already loaded, nothing will happen anyway
        // because of the check in fetchMoreTransactionsThunk
        fetchMoreTransactions(1, TX_PER_PAGE);
    }, [fetchMoreTransactions]);

    const handleOnEndReached = useCallback(async () => {
        try {
            await fetchMoreTransactions(page + 1, TX_PER_PAGE);
            setPage((currentPage: number) => currentPage + 1);
        } catch (e) {
            // TODO handle error state (show retry button or something
        }
    }, [fetchMoreTransactions, page]);

    const sectionsData = useMemo(
        () =>
            transactionMonthKeys.map(monthKey => ({
                monthKey,
                data: [...accountTransactionsByMonth[monthKey]],
            })),
        [accountTransactionsByMonth, transactionMonthKeys],
    );

    if (isLoadingTransactions) return <Loader />;

    return (
        <SectionList
            sections={sectionsData}
            renderItem={({ item, section, index }) =>
                tokenSymbol
                    ? renderTokenTransferItem({ item, section, index, accountKey, tokenSymbol })
                    : renderTransactionItem({
                          item,
                          section,
                          index,
                          accountKey,
                          areTokensIncluded,
                      })
            }
            style={applyStyle(sectionListStyle)}
            contentContainerStyle={applyStyle(sectionListContainerStyle)}
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={<TransactionsEmptyState accountKey={accountKey} />}
            ListHeaderComponent={listHeaderComponent}
            onEndReached={handleOnEndReached}
            stickySectionHeadersEnabled={false}
        />
    );
};
