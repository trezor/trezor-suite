import { useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

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
};

const wrapperStyle = prepareNativeStyle(() => ({
    height: SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
}));

export const TradeableAssetsSheetHeader = ({ onClose }: TradeableAssetsSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const [isFilterActive, setIsFilterActive] = useState(false);

    return (
        <SearchableSheetHeader
            onClose={onClose}
            title={<Translation id="moduleTrading.tradeableAssetsSheet.title" />}
            onFilterFocusChange={setIsFilterActive}
            style={applyStyle(wrapperStyle)}
        >
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                <TradeableAssetsFilterTabs
                    visible={isFilterActive}
                    animationDuration={FOCUS_ANIMATION_DURATION}
                />
            </Animated.View>
        </SearchableSheetHeader>
    );
};
