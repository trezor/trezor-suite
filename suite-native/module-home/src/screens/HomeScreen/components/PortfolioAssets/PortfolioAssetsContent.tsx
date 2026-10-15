import { useState } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import {
    type HomeAssetTableState,
    selectDisplayedWalletAssetKeys,
    selectHasShownWalletAssets,
    selectIsHomeAssetTableFoldable,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Box, Divider, VStack, useBottomSheetModal } from '@suite-native/atoms';

import { PortfolioAssetListItem } from './PortfolioAssetListItem';
import { PortfolioAssetsHeader } from './PortfolioAssetsHeader';
import { PortfolioAssetsSectionHeader } from './PortfolioAssetsSectionHeader';
import { PortfolioAssetsShowMoreButton } from './PortfolioAssetsShowMoreButton';
import { PortfolioAssetsViewOptionsSheet } from './PortfolioAssetsViewOptionsSheet';

const HOME_ASSET_ROW_LIMIT = 8;

const getAssetKey = (assetKey: WalletAssetKey) => assetKey;

const renderAsset = ({ item }: { item: WalletAssetKey }) => (
    <PortfolioAssetListItem assetKey={item} />
);

type PortfolioAssetsListHeaderProps = {
    hasAssets: boolean;
    onViewOptionsPress: () => void;
};

const PortfolioAssetsListHeader = ({
    hasAssets,
    onViewOptionsPress,
}: PortfolioAssetsListHeaderProps) => (
    <>
        <PortfolioAssetsHeader />
        {hasAssets && <PortfolioAssetsSectionHeader onViewOptionsPress={onViewOptionsPress} />}
    </>
);

type PortfolioAssetsListFooterProps = {
    isExpanded: boolean;
    onShowMorePress: () => void;
};

const PortfolioAssetsListFooter = ({
    isExpanded,
    onShowMorePress,
}: PortfolioAssetsListFooterProps) => (
    <>
        <Divider />
        <VStack alignItems="center" paddingVertical="sp12">
            <PortfolioAssetsShowMoreButton isExpanded={isExpanded} onPress={onShowMorePress} />
        </VStack>
    </>
);

export const PortfolioAssetsContent = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasAssets = useSelector(selectHasShownWalletAssets);
    const isFoldable = useSelector((state: HomeAssetTableState) =>
        selectIsHomeAssetTableFoldable(state, HOME_ASSET_ROW_LIMIT),
    );
    const rowLimit = isFoldable && !isExpanded ? HOME_ASSET_ROW_LIMIT : undefined;
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
