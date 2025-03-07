import {
    ListItemExtraData,
    useTradingFavouriteAssetsSectionList,
} from '../../../hooks/useTradingFavouriteAssetsSectionList';
import { TradingBottomSheetSectionList } from '../TradingBottomSheetSectionList';
import { TradeAssetsListEmptyComponent } from './TradeAssetsListEmptyComponent';
import { ASSET_ITEM_HEIGHT, TradeableAssetListItem } from './TradeableAssetListItem';
import { HEADER_HEIGHT, TradeableAssetsSheetHeader } from './TradeableAssetsSheetHeader';
import { ItemRenderConfig } from '../../../hooks/useSectionList';
import { TradeableAsset } from '../../../types';

export type TradeableAssetsSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onAssetSelect: (symbol: TradeableAsset) => void;
    assets: TradeableAsset[];
};

const keyExtractor = ({ cryptoId }: TradeableAsset, { isFavourite }: ListItemExtraData) =>
    `asset_${cryptoId}_${isFavourite ? 'favourite' : 'all'}`;

const renderItem = (
    asset: TradeableAsset,
    _: ItemRenderConfig<ListItemExtraData>,
    onAssetSelect: (asset: TradeableAsset) => void,
) => <TradeableAssetListItem asset={asset} onPress={() => onAssetSelect(asset)} />;

export const TradeableAssetsSheet = ({
    isVisible,
    onClose,
    onAssetSelect,
    assets,
}: TradeableAssetsSheetProps) => {
    const onAssetSelectCallback = (asset: TradeableAsset) => {
        onAssetSelect(asset);
        onClose();
    };

    const listData = useTradingFavouriteAssetsSectionList(assets);

    return (
        <TradingBottomSheetSectionList<TradeableAsset, ListItemExtraData>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<TradeAssetsListEmptyComponent />}
            handleComponent={() => <TradeableAssetsSheetHeader onClose={onClose} />}
            data={listData}
            keyExtractor={keyExtractor}
            estimatedItemSize={ASSET_ITEM_HEIGHT}
            estimatedHeaderHeight={HEADER_HEIGHT}
            renderItem={(item, config) => renderItem(item, config, onAssetSelectCallback)}
            noSingletonSectionHeader
        />
    );
};
