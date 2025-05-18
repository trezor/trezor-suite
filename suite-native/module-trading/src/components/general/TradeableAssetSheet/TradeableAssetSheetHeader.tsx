import { useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import {
    FOCUS_ANIMATION_DURATION,
    SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
    SearchableSheetHeader,
} from '../SearchableSheetHeader';
import { TradeableAssetFilterTabs } from './TradeableAssetFilterTabs';

type TradeableAssetsSheetHeaderProps = {
    onClose: () => void;
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
};

const wrapperStyle = prepareNativeStyle(() => ({
    height: SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
}));

export const TradeableAssetSheetHeader = ({
    onClose,
    onFilterChange,
    onSelectedNetworkFilter,
}: TradeableAssetsSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const [isFilterActive, setIsFilterActive] = useState(false);

    return (
        <SearchableSheetHeader
            onClose={onClose}
            title={<Translation id="moduleTrading.tradeableAssetsSheet.title" />}
            onFilterFocusChange={setIsFilterActive}
            onFilterChange={onFilterChange}
            style={applyStyle(wrapperStyle)}
            searchInputPlaceholder={translate(
                'moduleTrading.tradeableAssetsSheet.searchInputPlaceholder',
            )}
        >
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                <TradeableAssetFilterTabs
                    visible={isFilterActive}
                    animationDuration={FOCUS_ANIMATION_DURATION}
                    onSelectedNetworkFilter={onSelectedNetworkFilter}
                />
            </Animated.View>
        </SearchableSheetHeader>
    );
};
