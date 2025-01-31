import { ReactNode, useMemo } from 'react';

import { UnreachableCaseError } from '@suite-common/suite-utils';
import { TokenAddress } from '@suite-common/wallet-types';
import { BottomSheetFlashList, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradeAssetsListEmptyComponent } from './TradeAssetsListEmptyComponent';
import { ASSET_ITEM_HEIGHT, TradeableAssetListItem } from './TradeableAssetListItem';
import { TradeableAssetsSheetHeader } from './TradeableAssetsSheetHeader';
import { TradeableAsset } from '../../../types';

export type TradeableAssetsSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onAssetSelect: (symbol: TradeableAsset) => void;
};

type ListInnerItemShape =
    // [type, text, key]
    | ['sectionHeader', ReactNode, string]
    // [type, data, isFavourite]
    | ['asset', TradeableAsset, { isFavourite?: boolean; isFirst?: boolean; isLast?: boolean }];

const SECTION_HEADER_HEIGHT = 48 as const;

const mockFavourites: TradeableAsset[] = [
    { symbol: 'btc' },
    { symbol: 'eth' },
    {
        symbol: 'eth',
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as TokenAddress,
        name: 'USDC',
    },
];
const mockAssets: TradeableAsset[] = [
    { symbol: 'doge' },
    { symbol: 'sol' },
    { symbol: 'dsol' },
    { symbol: 'etc' },
    { symbol: 'xrp' },
    { symbol: 'ltc' },
    { symbol: 'arb' },
    { symbol: 'base' },
    { symbol: 'btc' },
    { symbol: 'eth' },
    { symbol: 'ada' },
    { symbol: 'bsc' },
];
const getMockFiatRate = () => Math.random() * 1000;
const getMockPriceChange = () => Math.random() * 3 - 1;

const getEstimatedListHeight = (itemsCount: number) =>
    itemsCount * ASSET_ITEM_HEIGHT + 2 * SECTION_HEADER_HEIGHT;

const transformToInnerFlatListData = (
    favourites: TradeableAsset[],
    assetsData: TradeableAsset[],
): ListInnerItemShape[] => [
    [
        'sectionHeader',
        <Translation key="favourites" id="moduleTrading.tradeableAssetsSheet.favouritesTitle" />,
        'section_favourites',
    ],
    ...favourites.map(
        (asset, index) =>
            [
                'asset',
                asset,
                {
                    isFavourite: true,
                    isFirst: index === 0,
                    isLast: index === favourites.length - 1,
                },
            ] as ListInnerItemShape,
    ),
    [
        'sectionHeader',
        <Translation key="all" id="moduleTrading.tradeableAssetsSheet.allTitle" />,
        'section_all',
    ],
    ...assetsData.map(
        (asset, index) =>
            [
                'asset',
                asset,
                {
                    isFavourite: false,
                    isFirst: index === 0,
                    isLast: index === assetsData.length - 1,
                },
            ] as ListInnerItemShape,
    ),
];

const keyExtractor = (item: ListInnerItemShape) => {
    switch (item[0]) {
        case 'sectionHeader':
            return item[2];

        case 'asset': {
            const [_, { symbol, contractAddress }, { isFavourite }] = item;

            return `asset_${symbol}_${contractAddress ?? ''}_${isFavourite ? 'favourite' : ''}`;
        }

        default:
            throw new UnreachableCaseError(item[0]);
    }
};

const renderItem = (data: ListInnerItemShape, onAssetSelect: (asset: TradeableAsset) => void) => {
    switch (data[0]) {
        case 'sectionHeader': {
            const text = data[1];

            return (
                <Box paddingVertical="sp12">
                    <Text variant="hint" color="textSubdued">
                        {text}
                    </Text>
                </Box>
            );
        }

        case 'asset': {
            const [_, asset, { isFavourite, isFirst, isLast }] = data;
            const toggleFavourite = () => {
                // TODO: Implement
                // eslint-disable-next-line no-console
                console.log('Not implemented!');
            };

            return (
                <TradeableAssetListItem
                    asset={asset}
                    onPress={() => onAssetSelect(asset)}
                    onFavouritePress={toggleFavourite}
                    priceChange={getMockPriceChange()}
                    fiatRate={getMockFiatRate()}
                    isFavourite={isFavourite}
                    isFirst={isFirst}
                    isLast={isLast}
                />
            );
        }

        default:
            throw new UnreachableCaseError(data[0]);
    }
};

export const TradeableAssetsSheet = ({
    isVisible,
    onClose,
    onAssetSelect,
}: TradeableAssetsSheetProps) => {
    const onAssetSelectCallback = (asset: TradeableAsset) => {
        onAssetSelect(asset);
        onClose();
    };

    const favourites = mockFavourites;
    const assetsData = mockAssets;
    const estimatedListHeight = getEstimatedListHeight(favourites.length + assetsData.length);

    const data: ListInnerItemShape[] = useMemo(
        () => transformToInnerFlatListData(favourites, assetsData),
        [favourites, assetsData],
    );

    return (
        <BottomSheetFlashList<ListInnerItemShape>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<TradeAssetsListEmptyComponent />}
            handleComponent={() => <TradeableAssetsSheetHeader onClose={onClose} />}
            data={data}
            keyExtractor={keyExtractor}
            estimatedListHeight={estimatedListHeight}
            estimatedItemSize={ASSET_ITEM_HEIGHT}
            renderItem={({ item }) => renderItem(item, onAssetSelectCallback)}
        />
    );
};
