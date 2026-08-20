import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashList, type FlashListRef } from '@shopify/flash-list';

import { type TradeableAssetBalances } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, EdgeFades, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TradeableAssetListItem } from './TradeableAssetListItem';
import { TradingAssetListEmptyComponent } from '../TradingAssetListEmptyComponent';
import { TradingAssetListHeader } from '../TradingAssetListHeader';

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

const listContentContainerStyle = prepareNativeStyle<{ bottomInset: number }>(
    ({ spacings }, { bottomInset }) => ({
        paddingTop: spacings.sp6,
        paddingBottom: bottomInset,
        paddingHorizontal: spacings.sp8,
    }),
);

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
    const { applyStyle, utils } = useNativeStyles();
    const { bottom } = useSafeAreaInsets();

    useEffect(() => {
        flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [scrollResetKey]);

    return (
        <VStack flex={1} spacing="sp10" testID={testID}>
            <TradingAssetListHeader
                onFilterChange={onFilterChange}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
                placeholder={translate(
                    'moduleTrading.tradeableAssetsSheet.searchInputPlaceholderText',
                )}
                selectedNetworkFilter={selectedNetworkFilter}
                testID={testID}
            />
            <Box flex={1}>
                <FlashList
                    maintainVisibleContentPosition={{ disabled: true }}
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
                    ListEmptyComponent={
                        <TradingAssetListEmptyComponent
                            title={
                                <Translation id="moduleTrading.tradeableAssetsSheet.emptyTitleText" />
                            }
                            subtitle={
                                <Translation id="moduleTrading.tradeableAssetsSheet.emptyDescriptionText" />
                            }
                        />
                    }
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={applyStyle(listContentContainerStyle, {
                        bottomInset: bottom,
                    })}
                />
                <EdgeFades direction="vertical" startSize={utils.spacings.sp16} endSize={bottom} />
            </Box>
        </VStack>
    );
};
