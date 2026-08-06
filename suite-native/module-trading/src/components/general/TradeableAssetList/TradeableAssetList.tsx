import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashList, type FlashListRef } from '@shopify/flash-list';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, EdgeFades, HStack, SearchInput, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { type TradeableAssetBalances } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';
import { useNativeStyles } from '@trezor/styles-native';

import { NetworkPicker } from './NetworkPicker';
import { TradeableAssetListEmptyComponent } from './TradeableAssetListEmptyComponent';
import { TradeableAssetListItem } from './TradeableAssetListItem';

export type TradeableAssetListProps = {
    assets: TradeableAsset[];
    onAssetSelect: (asset: TradeableAsset) => void;
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    selectedNetworkFilter: NetworkSymbol | undefined;
    scrollResetKey: string;
    assetBalances: TradeableAssetBalances;
    testID?: string;
};

const keyExtractor = ({ cryptoId }: TradeableAsset) => `asset_${cryptoId}`;

export const TradeableAssetList = ({
    assets,
    onAssetSelect,
    onFilterChange,
    onSelectedNetworkFilter,
    selectedNetworkFilter,
    scrollResetKey,
    assetBalances,
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
        <VStack flex={1} spacing="sp10" testID={testID}>
            <HStack spacing="sp12" paddingHorizontal="sp16" alignItems="center">
                <Box flex={1}>
                    <SearchInput
                        onChange={onFilterChange}
                        placeholder={translate(
                            'moduleTrading.tradeableAssetsSheet.searchInputPlaceholderText',
                        )}
                        autoCorrect={false}
                        size="large"
                        testId={testID ? `${testID}/search-input` : undefined}
                    />
                </Box>
                <NetworkPicker
                    selectedNetwork={selectedNetworkFilter}
                    onSelectNetwork={onSelectedNetworkFilter}
                    testID={testID ? `${testID}/network-picker` : undefined}
                />
            </HStack>
            <Box flex={1}>
                <FlashList
                    ref={flashListRef}
                    data={assets}
                    renderItem={({ item }) => (
                        <TradeableAssetListItem
                            asset={item}
                            balance={assetBalances.get(item.cryptoId)}
                            onPress={() => onAssetSelect(item)}
                        />
                    )}
                    extraData={assetBalances}
                    keyExtractor={keyExtractor}
                    ItemSeparatorComponent={() => <Box paddingVertical="sp4" />}
                    ListEmptyComponent={<TradeableAssetListEmptyComponent />}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingTop: utils.spacings.sp6,
                        paddingBottom: bottom,
                        paddingHorizontal: utils.spacings.sp8,
                    }}
                />
                <EdgeFades direction="vertical" startSize={utils.spacings.sp16} endSize={bottom} />
            </Box>
        </VStack>
    );
};
