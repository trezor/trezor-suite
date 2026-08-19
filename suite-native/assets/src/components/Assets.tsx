import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FlashList, type FlashListProps } from '@shopify/flash-list';

import { Box, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { selectDeviceNetworkSymbolsWithAssets, selectIsAssetListLoading } from '../assetsSelectors';
import { AssetItem } from './AssetItem';
import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';
import { type AssetListRow, getAssetListRowKey, getAssetListRows } from './getAssetListRows';

export type AssetsProps = Pick<
    FlashListProps<AssetListRow>,
    'ListHeaderComponent' | 'ListFooterComponent' | 'refreshControl' | 'onScroll'
>;

const listContentStyle = prepareNativeStyle<{ bottomInset: number }>((utils, { bottomInset }) => ({
    paddingBottom: Math.max(bottomInset, utils.spacings.sp24),
}));

const rowCardStyle = prepareNativeStyle<{ isFirst: boolean; isLast: boolean }>(
    (utils, { isFirst, isLast }) => ({
        backgroundColor: utils.colors.surfaceFillRaised,
        marginHorizontal: utils.spacings.sp16,
        extend: [
            {
                condition: isFirst,
                style: {
                    borderTopLeftRadius: utils.borders.radii.r16,
                    borderTopRightRadius: utils.borders.radii.r16,
                },
            },
            {
                condition: isLast,
                style: {
                    borderBottomLeftRadius: utils.borders.radii.r16,
                    borderBottomRightRadius: utils.borders.radii.r16,
                },
            },
        ],
    }),
);

export const Assets = ({
    ListHeaderComponent,
    ListFooterComponent,
    refreshControl,
    onScroll,
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
            <Box style={applyStyle(rowCardStyle, { isFirst: item.isFirst, isLast: item.isLast })}>
                {item.type === 'asset' ? (
                    <AssetItem cryptoCurrencySymbol={item.symbol} />
                ) : (
                    <DiscoveryAssetsLoader />
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
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            contentContainerStyle={applyStyle(listContentStyle, { bottomInset })}
            onScroll={onScroll}
        />
    );
};
