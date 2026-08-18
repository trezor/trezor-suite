import { type ReactElement, useCallback, useMemo } from 'react';
import { type ScrollViewProps } from 'react-native';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { Box, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { selectDeviceNetworkSymbolsWithAssets, selectIsAssetListLoading } from '../assetsSelectors';
import { AssetItem } from './AssetItem';
import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';
import { type AssetListRow, getAssetListRowKey, getAssetListRows } from './getAssetListRows';

type AssetsProps = {
    listHeaderComponent?: ReactElement | null;
    listFooterComponent?: ReactElement | null;
    refreshControl?: ScrollViewProps['refreshControl'];
};

// Keeps the last row clear of the home indicator on devices without a bottom inset.
const DEFAULT_BOTTOM_INSET = 25;

const listContentStyle = prepareNativeStyle<{ bottomInset: number }>((_, { bottomInset }) => ({
    paddingBottom: Math.max(bottomInset, DEFAULT_BOTTOM_INSET),
}));

const rowStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
}));

export const Assets = ({
    listHeaderComponent,
    listFooterComponent,
    refreshControl,
}: AssetsProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottom: bottomInset } = useBannerAwareSafeAreaInsets();

    const deviceNetworkSymbols = useSelector(selectDeviceNetworkSymbolsWithAssets);
    const isAssetListLoading = useSelector(selectIsAssetListLoading);

    const rows = useMemo(
        () => getAssetListRows(deviceNetworkSymbols, { isLoading: isAssetListLoading }),
        [deviceNetworkSymbols, isAssetListLoading],
    );

    const renderItem = useCallback(
        ({ item }: { item: AssetListRow }) => (
            <Box style={applyStyle(rowStyle)}>
                {item.type === 'asset' ? (
                    <AssetItem
                        cryptoCurrencySymbol={item.symbol}
                        isFirst={item.isFirst}
                        isLast={item.isLast}
                    />
                ) : (
                    <DiscoveryAssetsLoader isFirst={item.isFirst} isLast={item.isLast} />
                )}
            </Box>
        ),
        [applyStyle],
    );

    return (
        <FlashList
            data={rows}
            keyExtractor={getAssetListRowKey}
            getItemType={item => item.type}
            renderItem={renderItem}
            refreshControl={refreshControl}
            ListHeaderComponent={listHeaderComponent}
            ListFooterComponent={listFooterComponent}
            contentContainerStyle={applyStyle(listContentStyle, { bottomInset })}
        />
    );
};
