import { useCallback } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    ListItemExtraData,
    useTradingFavouriteAssetsSectionList,
} from '../../../hooks/general/useFavouriteAssetsSectionList';
import { BottomSheetSectionList } from '../BottomSheetSectionList';
import { TradeableAssetListEmptyComponent } from './TradeableAssetListEmptyComponent';
import { ASSET_ITEM_HEIGHT, TradeableAssetListItem } from './TradeableAssetListItem';
import { TradeableAssetSheetHeader } from './TradeableAssetSheetHeader';
import { ItemRenderConfig } from '../../../hooks/general/useSectionList';
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

export const TradeableAssetSheet = ({
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
            <TradeableAssetSheetHeader
                onClose={onClose}
                onFilterChange={onFilterChange}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
            />
        ),
        [onClose, onFilterChange, onSelectedNetworkFilter],
    );

    return (
        <BottomSheetSectionList<TradeableAsset, ListItemExtraData>
            isVisible={isVisible}
            onClose={onClose}
            ListEmptyComponent={<TradeableAssetListEmptyComponent />}
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
