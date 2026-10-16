import { useState } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    selectDisplayedWalletAssetKeys,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, Divider, useBottomSheetModal } from '@suite-native/atoms';

import { PortfolioAssetListItem } from './PortfolioAssetListItem';
import { PortfolioAssetsListFooter } from './PortfolioAssetsListFooter';
import { PortfolioAssetsListHeader } from './PortfolioAssetsListHeader';
import { PortfolioAssetsViewOptionsSheet } from './PortfolioAssetsViewOptionsSheet';

const getAssetKey = (assetKey: WalletAssetKey) => assetKey;

const renderAsset = ({ item }: { item: WalletAssetKey }) => (
    <PortfolioAssetListItem assetKey={item} />
);

export const PortfolioAssetsContent = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Capping a list no longer than the limit leaves it whole, so no foldability check is needed.
    const rowLimit = isExpanded ? undefined : HOME_ASSET_ROW_LIMIT;
    const assetKeys = useSelector((state: HomeAssetTableState) =>
        selectDisplayedWalletAssetKeys(state, rowLimit),
    );
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    const toggleIsExpanded = () => setIsExpanded(previous => !previous);

    return (
        <Box flex={1}>
            <FlashList
                testID="@home/portfolio-assets"
                data={assetKeys}
                renderItem={renderAsset}
                keyExtractor={getAssetKey}
                ItemSeparatorComponent={Divider}
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
