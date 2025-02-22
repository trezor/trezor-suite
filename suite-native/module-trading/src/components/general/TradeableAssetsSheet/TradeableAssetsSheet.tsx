import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { TokenAddress } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

import { getTradeableAssetFavouriteKey, selectTradingFavouriteAssets } from '../../../tradingSlice';
import {
    ItemRenderConfig,
    SectionListData,
    TradingBottomSheetSectionList,
} from '../TradingBottomSheetSectionList';
import { TradeAssetsListEmptyComponent } from './TradeAssetsListEmptyComponent';
import { ASSET_ITEM_HEIGHT, TradeableAssetListItem } from './TradeableAssetListItem';
import { TradeableAssetsSheetHeader } from './TradeableAssetsSheetHeader';
import { TradeableAsset } from '../../../types';

export type TradeableAssetsSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onAssetSelect: (symbol: TradeableAsset) => void;
};

type ListItemExtraData = {
    isFavourite: boolean;
};

const mockAssets: TradeableAsset[] = [
    { symbol: 'btc' },
    { symbol: 'eth' },
    {
        symbol: 'eth',
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as TokenAddress,
        name: 'USDC',
    },
    { symbol: 'doge' },
    { symbol: 'sol' },
    { symbol: 'dsol' },
    { symbol: 'etc' },
    { symbol: 'xrp' },
    { symbol: 'ltc' },
    { symbol: 'arb' },
    { symbol: 'base' },
    { symbol: 'ada' },
    { symbol: 'bsc' },
];
const getMockFiatRate = () => Math.random() * 1000;
const getMockPriceChange = () => Math.random() * 3 - 1;

const keyExtractor = (
    { symbol, contractAddress }: TradeableAsset,
    { isFavourite }: ListItemExtraData,
) => `asset_${symbol}_${contractAddress ?? ''}_${isFavourite ? 'favourite' : 'all'}`;

const renderItem = (
    asset: TradeableAsset,
    _: ItemRenderConfig<ListItemExtraData>,
    onAssetSelect: (asset: TradeableAsset) => void,
) => (
    <TradeableAssetListItem
        asset={asset}
        onPress={() => onAssetSelect(asset)}
        priceChange={getMockPriceChange()}
        fiatRate={getMockFiatRate()}
    />
);

export const TradeableAssetsSheet = ({
    isVisible,
    onClose,
    onAssetSelect,
}: TradeableAssetsSheetProps) => {
    const onAssetSelectCallback = (asset: TradeableAsset) => {
        onAssetSelect(asset);
        onClose();
    };

    const favourites = useSelector(selectTradingFavouriteAssets);

    const listData = useMemo(() => {
        const { favouriteData, allData } = mockAssets.reduce(
            (acc, a) => {
                const key = getTradeableAssetFavouriteKey(a);
                if (favourites[key]) {
                    acc.favouriteData.push(a);
                } else {
                    acc.allData.push(a);
                }

                return acc;
            },
            { favouriteData: [] as TradeableAsset[], allData: [] as TradeableAsset[] },
        );

        return [
            {
                key: 'section_favourites',
                label: <Translation id="moduleTrading.tradeableAssetsSheet.favouritesTitle" />,
                data: favouriteData,
                sectionData: { isFavourite: true },
            },
            {
                key: 'section_all',
                label: <Translation id="moduleTrading.tradeableAssetsSheet.allTitle" />,
                data: allData,
                sectionData: { isFavourite: false },
            },
        ].filter(({ data }) => data.length > 0) as SectionListData<
            TradeableAsset,
            ListItemExtraData
        >;
    }, [favourites]);

    return (
        <TradingBottomSheetSectionList<TradeableAsset, ListItemExtraData>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<TradeAssetsListEmptyComponent />}
            handleComponent={() => <TradeableAssetsSheetHeader onClose={onClose} />}
            data={listData}
            keyExtractor={keyExtractor}
            estimatedItemSize={ASSET_ITEM_HEIGHT}
            renderItem={(item, config) => renderItem(item, config, onAssetSelectCallback)}
            noSingletonSectionHeader
        />
    );
};
