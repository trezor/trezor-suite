import { useEffect, useRef } from 'react';

import { FlashList, type FlashListRef } from '@shopify/flash-list';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { SearchInput, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { FOCUS_ANIMATION_DURATION, useSectionList } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetFilterTabs } from './TradeableAssetFilterTabs';
import { TradeableAssetListEmptyComponent } from './TradeableAssetListEmptyComponent';
import { TradeableAssetListItem } from './TradeableAssetListItem';
import {
    type ListItemExtraData,
    useFavouriteAssetsSectionList,
} from '../../../hooks/general/useFavouriteAssetsSectionList';

export type TradeableAssetListProps = {
    assets: TradeableAsset[];
    onAssetSelect: (asset: TradeableAsset) => void;
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    scrollResetKey: string;
    testID?: string;
};

const keyExtractor = ({ cryptoId }: TradeableAsset) => `asset_${cryptoId}`;

export const TradeableAssetList = ({
    assets,
    onAssetSelect,
    onFilterChange,
    onSelectedNetworkFilter,
    scrollResetKey,
    testID,
}: TradeableAssetListProps) => {
    const { translate } = useTranslate();
    const listData = useFavouriteAssetsSectionList(assets);

    const {
        data: internalData,
        keyExtractor: internalKeyExtractor,
        renderItem: internalRenderItem,
    } = useSectionList<TradeableAsset, ListItemExtraData>({
        data: listData,
        keyExtractor,
        renderItem: asset => (
            <TradeableAssetListItem asset={asset} onPress={() => onAssetSelect(asset)} />
        ),
        noSingletonSectionHeader: true,
    });
    const flashListRef = useRef<FlashListRef<(typeof internalData)[number]>>(null);

    useEffect(() => {
        flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [scrollResetKey]);

    return (
        <VStack flex={1} spacing="sp16" testID={testID}>
            <SearchInput
                onChange={onFilterChange}
                placeholder={translate('moduleTrading.tradeableAssetsSheet.searchInputPlaceholder')}
                autoCorrect={false}
                testId={testID ? `${testID}/search-input` : undefined}
            />
            <TradeableAssetFilterTabs
                isVisible
                animationDuration={FOCUS_ANIMATION_DURATION}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
            />
            <FlashList
                ref={flashListRef}
                data={internalData}
                renderItem={internalRenderItem}
                keyExtractor={internalKeyExtractor}
                ListEmptyComponent={<TradeableAssetListEmptyComponent />}
                keyboardShouldPersistTaps="handled"
            />
        </VStack>
    );
};
