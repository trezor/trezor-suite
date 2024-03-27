import { ReactNode, useEffect, useState } from 'react';
import Animated, {
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { LayoutChangeEvent, Pressable } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { TITLE_MAX_FONT_MULTIPLIER } from './Text';

type ToggleProps = {
    leftLabel: ReactNode;
    rightLabel: ReactNode;
    isToggled: boolean;
    onToggle: () => void;
};

const TOGGLE_CONTAINER_HEIGHT = 40;
const TOGGLE_BUTTON_HEIGHT = 36;
const ANIMATION_DURATION = 150;
const TOGGLE_OFF_OFFSET = 0;

const switchContainerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    height: TOGGLE_CONTAINER_HEIGHT,
    borderRadius: utils.borders.radii.round,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
}));

const switchCircleStyle = prepareNativeStyle<{ width: number }>((utils, { width }) => ({
    width,
    height: TOGGLE_BUTTON_HEIGHT,
    backgroundColor: utils.colors.backgroundSurfaceElevation3,
    borderRadius: utils.borders.radii.round,
    alignSelf: 'center',
}));

const labelsContainerStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const labelStyle = prepareNativeStyle(utils => ({
    ...utils.typography.body,
}));

export const Toggle = ({ leftLabel, rightLabel, isToggled, onToggle }: ToggleProps) => {
    const { utils } = useNativeStyles();
    const { applyStyle } = useNativeStyles();
    const [containerWidth, setContainerWidth] = useState(0);

    const toggleOnOffset = containerWidth / 2;

    const togglePosition = isToggled ? toggleOnOffset : TOGGLE_OFF_OFFSET;
    const translateX = useSharedValue(togglePosition);

    useEffect(() => {
        translateX.value = withTiming(togglePosition, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
        });
    }, [togglePosition, translateX]);

    const animatedSwitchCircleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const animatedLeftLabelStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            translateX.value,
            [0, toggleOnOffset],
            [utils.colors.textPrimaryDefault, utils.colors.textSubdued],
        ),
    }));

    const animatedRightLabelStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            translateX.value,
            [0, toggleOnOffset],
            [utils.colors.textSubdued, utils.colors.textPrimaryDefault],
        ),
    }));

    const handleOnLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

    return (
        <Box flex={1} onLayout={handleOnLayout}>
            <Pressable onPress={onToggle}>
                <Animated.View style={[applyStyle(switchContainerStyle)]}>
                    <Animated.View
                        style={[
                            animatedSwitchCircleStyle,
                            applyStyle(switchCircleStyle, { width: containerWidth / 2 }),
                        ]}
                    />
                    <Box flexDirection="row" style={applyStyle(labelsContainerStyle)}>
                        <Box flex={1} alignItems="center" justifyContent="center">
                            <Animated.Text
                                style={[applyStyle(labelStyle), animatedLeftLabelStyle]}
                                maxFontSizeMultiplier={TITLE_MAX_FONT_MULTIPLIER}
                            >
                                {leftLabel}
                            </Animated.Text>
                        </Box>
                        <Box flex={1} alignItems="center" justifyContent="center">
                            <Animated.Text
                                style={[applyStyle(labelStyle), animatedRightLabelStyle]}
                                maxFontSizeMultiplier={TITLE_MAX_FONT_MULTIPLIER}
                            >
                                {rightLabel}
                            </Animated.Text>
                        </Box>
                    </Box>
                </Animated.View>
            </Pressable>
        </Box>
    );
};
