import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { selectIsLoadingTransactions } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { groupTransactionsByDate, MonthKey } from '@suite-common/wallet-utils';
import { Box, Loader } from '@suite-native/atoms';
import { EthereumTokenTransfer, WalletAccountTransaction } from '@suite-native/ethereum-tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionsEmptyState } from '../TransactionsEmptyState';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';

type AccountTransactionProps = {
    transactions: WalletAccountTransaction[];
    areTokensIncluded: boolean;
    fetchMoreTransactions: (pageToFetch: number, perPage: number) => void;
    listHeaderComponent: JSX.Element;
    accountKey: string;
    tokenContract?: TokenAddress;
};

type RenderSectionHeaderParams = {
    section: {
        monthKey: MonthKey;
    };
};

type RenderTransactionItemParams = {
    item: WalletAccountTransaction;
    accountKey: AccountKey;
    areTokensIncluded: boolean;
    isFirst: boolean;
    isLast: boolean;
};

type EthereumTokenTransferWithTx = EthereumTokenTransfer & {
    originalTransaction: WalletAccountTransaction;
};

type RenderTokenTransferItemParams = Omit<
    RenderTransactionItemParams,
    'areTokensIncluded' | 'item'
> & {
    item: EthereumTokenTransferWithTx;
    txid: string;
};

type TransactionListItem =
    | (EthereumTokenTransferWithTx | MonthKey)
    | (WalletAccountTransaction | MonthKey);

const sectionListStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.s,
    flex: 1,
}));

const sectionListContainerStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.s,
}));

const renderTransactionItem = ({
    item,
    isFirst,
    isLast,
    accountKey,
    areTokensIncluded,
}: RenderTransactionItemParams) => (
    <TransactionListItem
        key={item.txid}
        transaction={item}
        isFirst={isFirst}
        isLast={isLast}
        accountKey={accountKey}
        areTokensIncluded={areTokensIncluded}
    />
);

const renderTokenTransferItem = ({
    item: tokenTransfer,
    isLast,
    isFirst,
    accountKey,
    txid,
}: RenderTokenTransferItemParams) => (
    <TokenTransferListItem
        key={tokenTransfer.symbol}
        tokenTransfer={tokenTransfer}
        txid={txid}
        accountKey={accountKey}
        isFirst={isFirst}
        isLast={isLast}
    />
);

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
    tokenContract,
}: AccountTransactionProps) => {
    const { applyStyle } = useNativeStyles();
    const isLoadingTransactions = useSelector(selectIsLoadingTransactions);

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

    const data = useMemo((): TransactionListItem[] => {
        const accountTransactionsByMonth = groupTransactionsByDate(transactions, 'month');
        const transactionMonthKeys = Object.keys(accountTransactionsByMonth) as MonthKey[];

        if (tokenContract) {
            return transactionMonthKeys.flatMap(monthKey => [
                monthKey,
                ...accountTransactionsByMonth[monthKey].flatMap(transaction =>
                    transaction.tokens
                        .filter(token => token.contract === tokenContract)
                        .map(
                            tokenTransfer =>
                                ({
                                    ...tokenTransfer,
                                    originalTransaction: transaction,
                                }) as EthereumTokenTransferWithTx,
                        ),
                ),
            ]);
        }

        return transactionMonthKeys.flatMap(monthKey => [
            monthKey,
            ...accountTransactionsByMonth[monthKey],
        ]) as TransactionListItem[];
    }, [transactions, tokenContract]);

    const renderItem = useCallback(
        ({ item, index }: { item: TransactionListItem; index: number }) => {
            if (typeof item === 'string') {
                return renderSectionHeader({ section: { monthKey: item } });
            }
            const isFirstInSection = typeof data.at(index - 1) === 'string';
            const isLastInSection =
                typeof data.at(index + 1) === 'string' || index === data.length - 1;

            const getIsTokenTransfer = (
                itemForCheck: TransactionListItem,
            ): itemForCheck is EthereumTokenTransferWithTx => 'originalTransaction' in itemForCheck;

            return getIsTokenTransfer(item)
                ? renderTokenTransferItem({
                      item,
                      accountKey,
                      txid: item.originalTransaction.txid,
                      isFirst: isFirstInSection,
                      isLast: isLastInSection,
                  })
                : renderTransactionItem({
                      item,
                      accountKey,
                      areTokensIncluded,
                      isFirst: isFirstInSection,
                      isLast: isLastInSection,
                  });
        },
        [data, accountKey, areTokensIncluded],
    );

    if (isLoadingTransactions) return <Loader />;

    return (
        <Box style={applyStyle(sectionListStyle)}>
            <FlashList<TransactionListItem>
                data={data}
                renderItem={renderItem}
                contentContainerStyle={applyStyle(sectionListContainerStyle)}
                ListEmptyComponent={<TransactionsEmptyState accountKey={accountKey} />}
                ListHeaderComponent={listHeaderComponent}
                onEndReached={handleOnEndReached}
                estimatedItemSize={70}
            />
        </Box>
    );
};
