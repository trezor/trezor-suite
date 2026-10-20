import { useState } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { HOME_ASSET_ROW_LIMIT, type HomeAssetTableState } from '@suite-common/assets';
import { Box, useBottomSheetModal } from '@suite-native/atoms';
import { exhaustive } from '@trezor/type-utils';

import { PortfolioAssetListItem } from './PortfolioAssetListItem';
import { PortfolioAssetListSeparator } from './PortfolioAssetListSeparator';
import { PortfolioAssetNetworkHeader } from './PortfolioAssetNetworkHeader';
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
};

const renderEntry = ({ item }: RenderEntryParams) => {
    switch (item.type) {
        case 'network':
            return <PortfolioAssetNetworkHeader symbol={item.symbol} />;
        case 'asset':
            return <PortfolioAssetListItem assetKey={item.assetKey} />;
        default:
            return exhaustive(item);
    }
};

export const PortfolioAssetsContent = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Capping a list no longer than the limit leaves it whole, so no foldability check is needed.
    const rowLimit = isExpanded ? undefined : HOME_ASSET_ROW_LIMIT;
    const entries = useSelector((state: HomeAssetTableState) =>
        selectPortfolioAssetListEntries(state, rowLimit),
    );
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    const toggleIsExpanded = () => setIsExpanded(previous => !previous);

    return (
        <Box flex={1}>
            <FlashList
                testID="@home/portfolio-assets"
                data={entries}
                renderItem={renderEntry}
                keyExtractor={getEntryKey}
                getItemType={getEntryType}
                ItemSeparatorComponent={PortfolioAssetListSeparator}
                // Switching the grouping inserts network headers above the rows; anchoring on a row
                // would scroll away from them.
                maintainVisibleContentPosition={{ disabled: true }}
                ListHeaderComponent={<PortfolioAssetsListHeader onViewOptionsPress={openModal} />}
                ListFooterComponent={
                    <PortfolioAssetsListFooter
                        isExpanded={isExpanded}
                        onShowMorePress={toggleIsExpanded}
                    />
                }
            />
            <PortfolioAssetsViewOptionsSheet bottomSheetRef={bottomSheetRef} />
        </Box>
    );
};
