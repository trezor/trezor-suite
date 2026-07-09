import { memo, useCallback } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BottomSheetFlashListHandleProps } from '@suite-native/atoms';
import { BottomSheetSectionList, type ItemRenderConfig } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetListEmptyComponent } from './TradeableAssetListEmptyComponent';
import { TradeableAssetListItem } from './TradeableAssetListItem';
import { TradeableAssetSheetHeader } from './TradeableAssetSheetHeader';
import {
    type ListItemExtraData,
    useFavouriteAssetsSectionList,
} from '../../../hooks/general/useFavouriteAssetsSectionList';

export type TradeableAssetsSheetProps = {
    isVisible: boolean;
    onClose: (shouldHideKeyboard?: boolean) => void;
    onAssetSelect: (symbol: TradeableAsset) => void;
    hideKeyboardOnAssetSelect?: boolean;
    assets: TradeableAsset[];
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    scrollResetKey: string;
    testID?: string;
};

const keyExtractor = ({ cryptoId }: TradeableAsset) => `asset_${cryptoId}`;

const renderItem = (
    asset: TradeableAsset,
    _: ItemRenderConfig<ListItemExtraData>,
    onAssetSelect: (asset: TradeableAsset) => void,
) => <TradeableAssetListItem asset={asset} onPress={() => onAssetSelect(asset)} />;

export const TradeableAssetSheet = memo(
    ({
        isVisible,
        onClose,
        onAssetSelect,
        hideKeyboardOnAssetSelect,
        assets,
        onFilterChange,
        onSelectedNetworkFilter,
        scrollResetKey,
        testID,
    }: TradeableAssetsSheetProps) => {
        const listData = useFavouriteAssetsSectionList(assets);

        const headerTestID = testID ? `${testID}/header` : undefined;

        // we need to keep stable callback reference, otherwise header will be re-mounted on every keystroke
        const renderHandle = useCallback(
            ({ closeSheet }: BottomSheetFlashListHandleProps) => (
                <TradeableAssetSheetHeader
                    onClose={closeSheet}
                    onFilterChange={onFilterChange}
                    onSelectedNetworkFilter={onSelectedNetworkFilter}
                    testID={headerTestID}
                />
            ),
            [onFilterChange, onSelectedNetworkFilter, headerTestID],
        );

        return (
            <BottomSheetSectionList<TradeableAsset, ListItemExtraData>
                isVisible={isVisible}
                onClose={() => onClose(hideKeyboardOnAssetSelect)}
                ListEmptyComponent={<TradeableAssetListEmptyComponent />}
                handleComponent={renderHandle}
                data={listData}
                keyExtractor={keyExtractor}
                renderItem={(item, config, { closeSheet }) =>
                    renderItem(item, config, selectedAsset => {
                        onAssetSelect(selectedAsset);
                        closeSheet();
                    })
                }
                scrollResetKey={scrollResetKey}
                noSingletonSectionHeader
                testID={testID}
            />
        );
    },
);
