import { useEffect, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAtom } from 'jotai';

import { assetPriceChartRangeOptions } from '@suite-common/price-chart';
import { AnimatedView, Box, PressableOpacity, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { assetPriceChartRangeAtom } from './assetPriceChartRangeAtom';

const SELECTOR_PADDING = 4;
const SELECTION_ANIMATION_DURATION = 200;

const selectorStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    backgroundColor: utils.colors.surfaceFillSunken,
    borderRadius: utils.borders.radii.round,
    padding: SELECTOR_PADDING,
    position: 'relative',
}));

const selectionIndicatorStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    top: SELECTOR_PADDING,
    bottom: SELECTOR_PADDING,
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.round,
    ...utils.boxShadows.small,
}));

const optionStyle = prepareNativeStyle(utils => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: utils.borders.radii.round,
}));

export const AssetPriceChartRangeSelector = () => {
    const { applyStyle } = useNativeStyles();
    const [range, setRange] = useAtom(assetPriceChartRangeAtom);

    const selectedIndex = assetPriceChartRangeOptions.findIndex(option => option.range === range);
    const [width, setWidth] = useState(0);
    const translateX = useSharedValue(0);
    const optionWidth =
        width > 0 ? (width - SELECTOR_PADDING * 2) / assetPriceChartRangeOptions.length : 0;

    useEffect(() => {
        translateX.value = withTiming(SELECTOR_PADDING + selectedIndex * optionWidth, {
            duration: SELECTION_ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
        });
    }, [optionWidth, selectedIndex, translateX]);

    const selectionIndicatorAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        width: optionWidth,
    }));

    const handleLayout = (event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    };

    return (
        <Box style={applyStyle(selectorStyle)} onLayout={handleLayout}>
            <AnimatedView
                style={[applyStyle(selectionIndicatorStyle), selectionIndicatorAnimatedStyle]}
            />
            {assetPriceChartRangeOptions.map(option => {
                const isSelected = option.range === range;

                return (
                    <PressableOpacity
                        key={option.range}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        style={applyStyle(optionStyle)}
                        onPress={() => setRange(option.range)}
                    >
                        <Text
                            variant="body-md"
                            color={isSelected ? 'contentBrand' : 'contentSecondary'}
                        >
                            {option.label}
                        </Text>
                    </PressableOpacity>
                );
            })}
        </Box>
    );
};
