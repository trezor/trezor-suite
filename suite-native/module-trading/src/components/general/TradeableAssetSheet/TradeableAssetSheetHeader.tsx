import { useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    FOCUS_ANIMATION_DURATION,
    SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
    SearchableSheetHeader,
} from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradeableAssetFilterTabs } from './TradeableAssetFilterTabs';

type TradeableAssetsSheetHeaderProps = {
    onClose: () => void;
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    testID?: string;
};

const wrapperStyle = prepareNativeStyle(() => ({
    height: SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
}));

export const TradeableAssetSheetHeader = ({
    onClose,
    onFilterChange,
    onSelectedNetworkFilter,
    testID,
}: TradeableAssetsSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const [isFilterActive, setIsFilterActive] = useState(false);

    const searchInputTestId = testID ? `${testID}/search-input` : undefined;

    return (
        <SearchableSheetHeader
            onClose={onClose}
            title={<Translation id="moduleTrading.tradeableAssetsSheet.title" />}
            onFilterFocusChange={setIsFilterActive}
            onFilterChange={onFilterChange}
            style={applyStyle(wrapperStyle)}
            searchInputTestId={searchInputTestId}
            searchInputPlaceholder={translate(
                'moduleTrading.tradeableAssetsSheet.searchInputPlaceholder',
            )}
        >
            <Animated.View
                layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}
                testID={testID}
            >
                <TradeableAssetFilterTabs
                    visible={isFilterActive}
                    animationDuration={FOCUS_ANIMATION_DURATION}
                    onSelectedNetworkFilter={onSelectedNetworkFilter}
                />
            </Animated.View>
        </SearchableSheetHeader>
    );
};
