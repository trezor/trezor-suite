import { useCallback } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    ListItemExtraData,
    useTradingFavouriteAssetsSectionList,
} from '../../../hooks/useTradingFavouriteAssetsSectionList';
import { TradingBottomSheetSectionList } from '../TradingBottomSheetSectionList';
import { TradeAssetsListEmptyComponent } from './TradeAssetsListEmptyComponent';
import { ASSET_ITEM_HEIGHT, TradeableAssetListItem } from './TradeableAssetListItem';
import { TradeableAssetsSheetHeader } from './TradeableAssetsSheetHeader';
import { ItemRenderConfig } from '../../../hooks/useSectionList';
import { TradeableAsset } from '../../../types';

export type TradeableAssetsSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onAssetSelect: (symbol: TradeableAsset) => void;
    assets: TradeableAsset[];
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    flashListKey: string;
};

const keyExtractor = ({ cryptoId }: TradeableAsset) => `asset_${cryptoId}`;

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
    onFilterChange,
    onSelectedNetworkFilter,
    flashListKey,
}: TradeableAssetsSheetProps) => {
    const onAssetSelectCallback = (asset: TradeableAsset) => {
        onAssetSelect(asset);
        onClose();
    };

    const listData = useTradingFavouriteAssetsSectionList(assets);

    // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
    const renderHandle = useCallback(
        () => (
            <TradeableAssetsSheetHeader
                onClose={onClose}
                onFilterChange={onFilterChange}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
            />
        ),
        [onClose, onFilterChange, onSelectedNetworkFilter],
    );

    return (
        <TradingBottomSheetSectionList<TradeableAsset, ListItemExtraData>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<TradeAssetsListEmptyComponent />}
            handleComponent={renderHandle}
            data={listData}
            keyExtractor={keyExtractor}
            estimatedItemSize={ASSET_ITEM_HEIGHT}
            renderItem={(item, config) => renderItem(item, config, onAssetSelectCallback)}
            flashListKey={flashListKey}
            noSingletonSectionHeader
        />
    );
};
