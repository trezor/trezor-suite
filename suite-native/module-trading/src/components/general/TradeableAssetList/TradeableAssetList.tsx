import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashList, type FlashListRef } from '@shopify/flash-list';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, EdgeFades, SearchInput, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { FOCUS_ANIMATION_DURATION } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';
import { useNativeStyles } from '@trezor/styles-native';

import { TradeableAssetFilterTabs } from './TradeableAssetFilterTabs';
import { TradeableAssetListEmptyComponent } from './TradeableAssetListEmptyComponent';
import { TradeableAssetListItem } from './TradeableAssetListItem';

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
    const flashListRef = useRef<FlashListRef<TradeableAsset>>(null);
    const { utils } = useNativeStyles();
    const { bottom } = useSafeAreaInsets();

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
            <Box flex={1}>
                <FlashList
                    ref={flashListRef}
                    data={assets}
                    renderItem={({ item }) => (
                        <TradeableAssetListItem asset={item} onPress={() => onAssetSelect(item)} />
                    )}
                    keyExtractor={keyExtractor}
                    ItemSeparatorComponent={() => <Box paddingVertical="sp4" />}
                    ListEmptyComponent={<TradeableAssetListEmptyComponent />}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingBottom: bottom,
                        paddingHorizontal: utils.spacings.sp8,
                    }}
                />
                <EdgeFades direction="vertical" startSize={utils.spacings.sp16} endSize={bottom} />
            </Box>
        </VStack>
    );
};
