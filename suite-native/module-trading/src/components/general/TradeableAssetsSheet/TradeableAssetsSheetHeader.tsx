import { useState } from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { BottomSheetGrabber, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SheetHeaderTitle } from '../SheetHeaderTitle';
import { TradeableAssetsFilterTabs } from './TradeableAssetsFilterTabs';
import { SearchInputWithCancel } from '../SearchInputWithCancel';

type TradeableAssetsSheetHeaderProps = {
    onClose: () => void;
};

const HEADER_HEIGHT = 160;
const FOCUS_ANIMATION_DURATION = 300 as const;

const wrapperStyle = prepareNativeStyle<{}>(({ spacings }) => ({
    height: HEADER_HEIGHT,
    padding: spacings.sp16,
    gap: spacings.sp16,
}));

export const TradeableAssetsSheetHeader = ({ onClose }: TradeableAssetsSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const [isFilterActive, setIsFilterActive] = useState(false);
    const [filterValue, setFilterValue] = useState('');

    return (
        <VStack style={applyStyle(wrapperStyle)}>
            <BottomSheetGrabber />
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                {!isFilterActive && (
                    <Animated.View
                        entering={FadeIn.duration(FOCUS_ANIMATION_DURATION)}
                        exiting={FadeOut.duration(FOCUS_ANIMATION_DURATION)}
                    >
                        <SheetHeaderTitle
                            leftButtonIcon="x"
                            onLeftButtonPress={onClose}
                            leftButtonA11yLabel={translate('generic.buttons.close')}
                        >
                            <Translation id="moduleTrading.tradeableAssetsSheet.title" />
                        </SheetHeaderTitle>
                    </Animated.View>
                )}
            </Animated.View>
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                <SearchInputWithCancel
                    onChange={setFilterValue}
                    onFocus={() => setIsFilterActive(true)}
                    onBlur={() => setIsFilterActive(false)}
                    value={filterValue}
                />
            </Animated.View>
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                <TradeableAssetsFilterTabs
                    visible={isFilterActive}
                    animationDuration={FOCUS_ANIMATION_DURATION}
                />
            </Animated.View>
        </VStack>
    );
};
