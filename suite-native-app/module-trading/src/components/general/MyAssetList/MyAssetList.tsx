import { useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashList, type FlashListRef } from '@shopify/flash-list';

import { Box, EdgeFades, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { type MyAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type MyAssetsSection } from '../../../hooks/general/useMyAssetsFilteredData';
import { TradingAssetListEmptyComponent } from '../TradingAssetListEmptyComponent';
import {
    TradingAssetListHeader,
    type TradingAssetListHeaderProps,
} from '../TradingAssetListHeader';
import { MyAssetListSection } from './MyAssetListSection';

export type MyAssetListProps = {
    assets: MyAssetsSection[];
    onAssetSelect: (asset: MyAsset, account: MyAssetsSection['sectionData']) => void;
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: TradingAssetListHeaderProps['onSelectedNetworkFilter'];
    scrollResetKey: string;
    selectedNetworkFilter: TradingAssetListHeaderProps['selectedNetworkFilter'];
    testID?: string;
};

const keyExtractor = ({ key }: MyAssetsSection) => key;

const listContentContainerStyle = prepareNativeStyle<{ bottomInset: number }>(
    ({ spacings }, { bottomInset }) => ({
        paddingTop: spacings.sp16,
        paddingBottom: bottomInset,
        paddingHorizontal: spacings.sp16,
    }),
);

export const MyAssetList = ({
    assets,
    onAssetSelect,
    onFilterChange,
    onSelectedNetworkFilter,
    scrollResetKey,
    selectedNetworkFilter,
    testID,
}: MyAssetListProps) => {
    const { translate } = useTranslate();
    const listRef = useRef<FlashListRef<MyAssetsSection>>(null);
    const { bottom } = useSafeAreaInsets();
    const { applyStyle, utils } = useNativeStyles();

    useEffect(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [scrollResetKey]);

    const renderItem = useCallback(
        ({ item: section, index }: { item: MyAssetsSection; index: number }) => (
            <MyAssetListSection
                index={index}
                onAssetSelect={onAssetSelect}
                section={section}
                testID={testID}
            />
        ),
        [onAssetSelect, testID],
    );

    return (
        <VStack flex={1} spacing="sp10" testID={testID}>
            <TradingAssetListHeader
                networkFilterMode="discovered"
                onFilterChange={onFilterChange}
                onSelectedNetworkFilter={onSelectedNetworkFilter}
                placeholder={translate('moduleTrading.myAssetScreen.searchInputPlaceholder')}
                selectedNetworkFilter={selectedNetworkFilter}
                testID={testID}
            />
            <Box flex={1}>
                <FlashList
                    maintainVisibleContentPosition={{ disabled: true }}
                    ref={listRef}
                    data={assets}
                    keyExtractor={keyExtractor}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <TradingAssetListEmptyComponent
                            title={<Translation id="moduleTrading.myAssetScreen.emptyTitle" />}
                            subtitle={
                                <Translation id="moduleTrading.myAssetScreen.emptyDescription" />
                            }
                        />
                    }
                    contentContainerStyle={applyStyle(listContentContainerStyle, {
                        bottomInset: bottom,
                    })}
                    renderItem={renderItem}
                />
                <EdgeFades direction="vertical" startSize={utils.spacings.sp16} endSize={bottom} />
            </Box>
        </VStack>
    );
};
