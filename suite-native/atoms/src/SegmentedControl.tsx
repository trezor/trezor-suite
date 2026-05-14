import { type ReactNode, useEffect, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from './Box';
import { PressableOpacity } from './Pressable';
import { Text } from './Text';

const CONTAINER_PADDING = 2;
const ANIMATION_DURATION = 200;

const containerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    backgroundColor: utils.colors.surfaceFillSunken,
    borderRadius: utils.borders.radii.round,
    padding: CONTAINER_PADDING,
    position: 'relative',
}));

const indicatorStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    backgroundColor: utils.colors.legacyBackgroundSurfaceElevation3,
    borderRadius: utils.borders.radii.round,
    ...utils.boxShadows.small,
}));

const optionStyle = prepareNativeStyle(utils => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderRadius: utils.borders.radii.round,
}));

export type SegmentedControlOption<TValue extends string> = {
    label: ReactNode;
    value: TValue;
};

export type SegmentedControlProps<TValue extends string> = {
    options: Array<SegmentedControlOption<TValue>>;
    selectedValue: TValue;
    onValueChange: (value: TValue) => void;
    testID?: string;
};

export const SegmentedControl = <TValue extends string>({
    options,
    selectedValue,
    onValueChange,
    testID,
}: SegmentedControlProps<TValue>) => {
    const { applyStyle } = useNativeStyles();

    const selectedIndex = options.findIndex(option => option.value === selectedValue);
    const optionCount = options.length;

    const [width, setWidth] = useState(0);
    const translateX = useSharedValue(0);

    const segmentWidth = width > 0 ? (width - CONTAINER_PADDING * 2) / optionCount : 0;

    useEffect(() => {
        const targetX = CONTAINER_PADDING + selectedIndex * segmentWidth;
        translateX.value = withTiming(targetX, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
        });
    }, [selectedIndex, segmentWidth, translateX]);

    const handleLayout = (event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    };

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        width: segmentWidth,
    }));

    if (optionCount === 0) {
        return null;
    }

    return (
        <Box style={applyStyle(containerStyle)} onLayout={handleLayout} testID={testID}>
            <Animated.View style={[applyStyle(indicatorStyle), animatedIndicatorStyle]} />
            {options.map(option => {
                const isSelected = option.value === selectedValue;

                return (
                    <PressableOpacity
                        key={option.value}
                        style={applyStyle(optionStyle)}
                        onPress={() => onValueChange(option.value)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        testID={testID ? `${testID}/${option.value}` : undefined}
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
