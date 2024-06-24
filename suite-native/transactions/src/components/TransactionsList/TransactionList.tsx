import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshControl } from 'react-native';

import { FlashList } from '@shopify/flash-list';

import {
    fetchAllTransactionsForAccountThunk,
    fetchAndUpdateAccountThunk,
    FiatRatesRootState,
    selectIsLoadingAccountTransactions,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { groupTransactionsByDate, MonthKey } from '@suite-common/wallet-utils';
import { Box, Loader } from '@suite-native/atoms';
import {
    EthereumTokenTransfer,
    selectAccountOrTokenAccountTransactions,
    WalletAccountTransaction,
} from '@suite-native/ethereum-tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { SettingsSliceRootState } from '@suite-native/settings';

import { TransactionsEmptyState } from '../TransactionsEmptyState';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';

type AccountTransactionProps = {
    areTokensIncluded: boolean;
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
    paddingHorizontal: utils.spacings.small,
    flex: 1,
}));

const sectionListContainerStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.small,
}));

const renderTransactionItem = ({
    item,
    isFirst,
    isLast,
    accountKey,
    areTokensIncluded,
}: RenderTransactionItemParams) => (
    <TransactionListItem
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
        transaction={tokenTransfer.originalTransaction}
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
    areTokensIncluded,
    listHeaderComponent,
    accountKey,
    tokenContract,
}: AccountTransactionProps) => {
    const dispatch = useDispatch();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const isLoadingTransactions = useSelector((state: TransactionsRootState) =>
        selectIsLoadingAccountTransactions(state, accountKey),
    );
    const transactions = useSelector(
        (state: TransactionsRootState & FiatRatesRootState & SettingsSliceRootState) =>
            selectAccountOrTokenAccountTransactions(
                state,
                accountKey,
                tokenContract ?? null,
                areTokensIncluded,
            ),
    );
    const isLoaderVisible = isLoadingTransactions && transactions.length === 0;

    const fetchTransactions = useCallback(() => {
        return dispatch(fetchAllTransactionsForAccountThunk({ accountKey }));
    }, [accountKey, dispatch]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleOnRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true);
            await Promise.allSettled([
                dispatch(fetchAndUpdateAccountThunk({ accountKey })),
                fetchTransactions(),
            ]);
        } catch (e) {
            // Do nothing
        }
        // It's usually too fast so loading indicator only flashes for a moment, which is not nice
        setTimeout(() => setIsRefreshing(false), 1500);
    }, [dispatch, accountKey, fetchTransactions]);

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

    return (
        <Box style={applyStyle(sectionListStyle)}>
            <FlashList<TransactionListItem>
                data={data}
                renderItem={renderItem}
                contentContainerStyle={applyStyle(sectionListContainerStyle)}
                ListEmptyComponent={<TransactionsEmptyState accountKey={accountKey} />}
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={isLoaderVisible ? <Loader /> : null}
                estimatedItemSize={25}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleOnRefresh}
                        colors={[colors.backgroundPrimaryDefault]}
                    />
                }
            />
        </Box>
    );
};
