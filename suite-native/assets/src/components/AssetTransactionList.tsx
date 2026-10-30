import { type JSX } from 'react';
import { RefreshControl } from 'react-native';

import { FlashList } from '@shopify/flash-list';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Box, useScrollDivider } from '@suite-native/atoms';
import {
    TokenTransferListItem,
    TransactionListGroupTitle,
    TransactionListItem,
} from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AssetTransactionListEmptyState } from './AssetTransactionListEmptyState';
import { AssetTransactionListFooter } from './AssetTransactionListFooter';
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
            isAccountLabelShown
        />
    ) : (
        <TransactionListItem
            transaction={item.transaction}
            accountKey={item.accountKey}
            isFirst={item.isFirstOfDay}
            isLast={item.isLastOfDay}
            isAccountLabelShown
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
        isLoading,
        isRefreshing,
        loadMore,
        refresh,
    } = useAssetTransactions({ networkSymbol, tokenContract });
    const isInitialLoading = isLoading && items.length === 0;
    const isLoadingMore = isLoading && items.length > 0;
    const mayHaveUnloadedTokenTransfers =
        !!tokenContract && hasMoreTransactions && !needsOlderHistoryScan;

    return (
        <Box flex={1}>
            {scrollDivider}
            <FlashList<AssetTransactionListItem>
                data={items}
                renderItem={renderItem}
                contentContainerStyle={applyStyle(listContainerStyle)}
                ListEmptyComponent={
                    <AssetTransactionListEmptyState
                        isLoading={isInitialLoading}
                        isDeferred={mayHaveUnloadedTokenTransfers || hasLoadingFailed}
                        isRecentWindowEmpty={needsOlderHistoryScan}
                    />
                }
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={
                    <AssetTransactionListFooter
                        hasMoreTransactions={hasMoreTransactions}
                        needsOlderHistoryScan={needsOlderHistoryScan}
                        historyCoveredSince={historyCoveredSince}
                        hasLoadingFailed={hasLoadingFailed}
                        isInitialLoading={isInitialLoading}
                        isLoadingMore={isLoadingMore}
                        onLoadMore={loadMore}
                    />
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
};
