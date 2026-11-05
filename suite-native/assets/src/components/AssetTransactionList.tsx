import { type JSX } from 'react';
import { RefreshControl } from 'react-native';

import { FlashList } from '@shopify/flash-list';

import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, useScrollDivider } from '@suite-native/atoms';
import { TokenMetadataProvider } from '@suite-native/tokens';
import {
    OlderHistoryStatus,
    TokenTransferListItem,
    TransactionListEmptyState,
    TransactionListGroupTitle,
    TransactionListItem,
    TransactionsListFooter,
} from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AssetTransactionSubtitle } from './AssetTransactionSubtitle';
import { useAssetTransactions } from '../hooks/useAssetTransactions';
import { type AssetTransactionListItem } from '../utils/assetTransactionsUtils';

const listContainerStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp8,
}));

const listFooterStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp32,
}));

type RenderItemParams = {
    item: AssetTransactionListItem;
};

const getItemType = (item: AssetTransactionListItem) => {
    if (typeof item === 'string') {
        return 'dayTitle';
    }

    return item.tokenTransfer ? 'tokenTransfer' : 'transaction';
};

const renderItem = ({ item }: RenderItemParams) => {
    if (typeof item === 'string') {
        return <TransactionListGroupTitle dayKey={item} />;
    }

    return item.tokenTransfer ? (
        <TokenTransferListItem
            transaction={item.transaction}
            tokenTransfer={item.tokenTransfer}
            accountKey={item.accountKey}
            isFirst={item.isFirstOfDay}
            isLast={item.isLastOfDay}
            subtitleComponent={AssetTransactionSubtitle}
        />
    ) : (
        <TransactionListItem
            transaction={item.transaction}
            accountKey={item.accountKey}
            isFirst={item.isFirstOfDay}
            isLast={item.isLastOfDay}
            subtitleComponent={AssetTransactionSubtitle}
        />
    );
};

type AssetTransactionListProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    listHeaderComponent: JSX.Element;
};

export const AssetTransactionList = ({
    networkSymbol,
    tokenContract,
    listHeaderComponent,
}: AssetTransactionListProps) => {
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const { scrollDivider, handleScroll } = useScrollDivider();
    const {
        items,
        hasMoreTransactions,
        needsOlderHistoryScan,
        historyCoveredSince,
        hasLoadingFailed,
        isEmptyStateDeferred,
        isInitialLoading,
        isLoadingMore,
        isRefreshing,
        loadMore,
        refresh,
    } = useAssetTransactions({ networkSymbol, tokenContract });

    const content = (
        <Box flex={1}>
            {scrollDivider}
            <FlashList<AssetTransactionListItem>
                data={items}
                renderItem={renderItem}
                getItemType={getItemType}
                contentContainerStyle={applyStyle(listContainerStyle)}
                ListEmptyComponent={
                    <TransactionListEmptyState
                        isLoading={isInitialLoading}
                        isDeferred={isEmptyStateDeferred}
                        isRecentWindowEmpty={needsOlderHistoryScan}
                    />
                }
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={
                    isInitialLoading ? null : (
                        <TransactionsListFooter
                            hasMoreTransactions={hasMoreTransactions}
                            isOlderHistory={needsOlderHistoryScan}
                            isLoading={isLoadingMore}
                            onButtonPress={loadMore}
                        >
                            {(needsOlderHistoryScan || hasLoadingFailed) && (
                                <OlderHistoryStatus
                                    historyCoveredSince={historyCoveredSince}
                                    hasLoadingFailed={hasLoadingFailed}
                                />
                            )}
                        </TransactionsListFooter>
                    )
                }
                ListFooterComponentStyle={applyStyle(listFooterStyle)}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        colors={[colors.elementFillBrandBold]}
                    />
                }
                refreshing={isRefreshing}
                onScroll={handleScroll}
            />
        </Box>
    );

    return (
        <TokenMetadataProvider
            sources={[
                {
                    networkSymbol,
                    tokens: items.flatMap(item =>
                        typeof item === 'string' ? [] : (item.transaction.tokens ?? []),
                    ),
                },
            ]}
        >
            {content}
        </TokenMetadataProvider>
    );
};
