import { useState } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectIsHomeAssetTableFoldable,
    selectIsHomeAssetTableMenuAvailable,
} from '@suite-common/assets';
import { setAreHomeAssetSmallBalancesShown } from '@suite-common/wallet-core';
import {
    WalletAssetCardSegment,
    WalletAssetListItem,
    selectIsAssetListLoading,
} from '@suite-native/assets';
import { Box, useBottomSheetModal } from '@suite-native/atoms';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { PortfolioAssetListSeparator } from './PortfolioAssetListSeparator';
import { PortfolioAssetNetworkHeader } from './PortfolioAssetNetworkHeader';
import { PortfolioAssetsEmptyState } from './PortfolioAssetsEmptyState';
import { PortfolioAssetsListFooter } from './PortfolioAssetsListFooter';
import { PortfolioAssetsListHeader } from './PortfolioAssetsListHeader';
import { PortfolioAssetsViewOptionsSheet } from './PortfolioAssetsViewOptionsSheet';
import {
    type PortfolioAssetListEntry,
    selectPortfolioAssetListEntries,
} from './portfolioAssetListSelectors';

const getEntryKey = (entry: PortfolioAssetListEntry) => {
    switch (entry.type) {
        case 'network':
            return `network-${entry.symbol}`;
        case 'asset':
            return entry.assetKey;
        default:
            return exhaustive(entry);
    }
};

const getEntryType = (entry: PortfolioAssetListEntry) => entry.type;

type RenderEntryParams = {
    item: PortfolioAssetListEntry;
    index: number;
};

export const PortfolioAssetsContent = () => {
    const [isListExpanded, setIsListExpanded] = useState(false);
    // Capping a list no longer than the limit leaves it whole, so no foldability check is needed.
    const rowLimit = isListExpanded ? undefined : HOME_ASSET_ROW_LIMIT;
    const entries = useSelector((state: HomeAssetTableState) =>
        selectPortfolioAssetListEntries(state, rowLimit),
    );
    const isFoldable = useSelector((state: HomeAssetTableState) =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );
    const isAssetListLoading = useSelector(selectIsAssetListLoading);
    const isMenuAvailable = useSelector(selectIsHomeAssetTableMenuAvailable);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const { dispatch } = useServices(injectDispatch);

    const renderEntryContent = (entry: PortfolioAssetListEntry) => {
        switch (entry.type) {
            case 'network':
                return <PortfolioAssetNetworkHeader symbol={entry.symbol} />;
            case 'asset':
                return <WalletAssetListItem assetKey={entry.assetKey} />;
            default:
                return exhaustive(entry);
        }
    };

    const isLoadingSkeletonVisible = isAssetListLoading && (!isFoldable || isListExpanded);
    const isListEmpty = entries.length === 0;
    const isEmptyStateVisible = isListEmpty && !isAssetListLoading;

    const renderEntry = ({ item, index }: RenderEntryParams) => (
        <WalletAssetCardSegment
            isFirst={index === 0}
            // The skeleton or Show more closes the card when present.
            isLast={index === entries.length - 1 && !isFoldable && !isLoadingSkeletonVisible}
        >
            {renderEntryContent(item)}
        </WalletAssetCardSegment>
    );

    const toggleIsListExpanded = () => {
        setIsListExpanded(previous => !previous);
    };

    const changeSmallBalances = (areShown: boolean) => {
        if (areShown) {
            setIsListExpanded(true);
        }
        dispatch(setAreHomeAssetSmallBalancesShown(areShown));
    };

    return (
        <Box flex={1}>
            <FlashList
                testID="@home/portfolio-assets"
                data={entries}
                renderItem={renderEntry}
                keyExtractor={getEntryKey}
                getItemType={getEntryType}
                // FlashList re-renders rows only when `data` or `extraData` changes. The skeleton can
                // disappear while `data` stays the same, and the last row must then round its corners.
                extraData={isLoadingSkeletonVisible}
                ItemSeparatorComponent={PortfolioAssetListSeparator}
                // Switching the grouping inserts network headers above the rows; anchoring on a row
                // would scroll away from them.
                maintainVisibleContentPosition={{ disabled: true }}
                ListHeaderComponent={
                    <PortfolioAssetsListHeader
                        isNewBannerVisible={!isListEmpty}
                        onViewOptionsPress={openModal}
                    />
                }
                ListEmptyComponent={isEmptyStateVisible ? <PortfolioAssetsEmptyState /> : null}
                ListFooterComponent={
                    <PortfolioAssetsListFooter
                        isListExpanded={isListExpanded}
                        isListEmpty={isListEmpty}
                        isFoldable={isFoldable}
                        isLoadingSkeletonVisible={isLoadingSkeletonVisible}
                        onShowMorePress={toggleIsListExpanded}
                    />
                }
            />
            {isMenuAvailable && (
                <PortfolioAssetsViewOptionsSheet
                    bottomSheetRef={bottomSheetRef}
                    onSmallBalancesChange={changeSmallBalances}
                    onHiddenTokensPress={closeModal}
                />
            )}
        </Box>
    );
};
