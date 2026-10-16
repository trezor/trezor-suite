import { useState } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import {
    HOME_ASSET_ROW_LIMIT,
    type HomeAssetTableState,
    getHomeAssetRowLimit,
    selectDisplayedWalletAssetKeys,
    selectHasShownWalletAssets,
    selectIsHomeAssetTableFoldable,
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
    const hasAssets = useSelector(selectHasShownWalletAssets);
    const isFoldable = useSelector((state: HomeAssetTableState) =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );
    const rowLimit = getHomeAssetRowLimit({ isFoldable, isExpanded });
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
                ListHeaderComponent={
                    <PortfolioAssetsListHeader
                        hasAssets={hasAssets}
                        onViewOptionsPress={openModal}
                    />
                }
                ListFooterComponent={
                    isFoldable ? (
                        <PortfolioAssetsListFooter
                            isExpanded={isExpanded}
                            onShowMorePress={toggleIsExpanded}
                        />
                    ) : null
                }
            />
            <PortfolioAssetsViewOptionsSheet bottomSheetRef={bottomSheetRef} />
        </Box>
    );
};
