import { useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import {
    FOCUS_ANIMATION_DURATION,
    SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
    SearchableSheetHeader,
} from '../SearchableSheetHeader';
import { TradeableAssetsFilterTabs } from './TradeableAssetsFilterTabs';

type TradeableAssetsSheetHeaderProps = {
    onClose: () => void;
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
};

const wrapperStyle = prepareNativeStyle(() => ({
    height: SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
}));

export const TradeableAssetsSheetHeader = ({
    onClose,
    onFilterChange,
    onSelectedNetworkFilter,
}: TradeableAssetsSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const [isFilterActive, setIsFilterActive] = useState(false);

    return (
        <SearchableSheetHeader
            onClose={onClose}
            title={<Translation id="moduleTrading.tradeableAssetsSheet.title" />}
            onFilterFocusChange={setIsFilterActive}
            onFilterChange={onFilterChange}
            style={applyStyle(wrapperStyle)}
        >
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                <TradeableAssetsFilterTabs
                    visible={isFilterActive}
                    animationDuration={FOCUS_ANIMATION_DURATION}
                    onSelectedNetworkFilter={onSelectedNetworkFilter}
                />
            </Animated.View>
        </SearchableSheetHeader>
    );
};
