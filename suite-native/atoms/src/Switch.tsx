import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    interpolateColor,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { palette } from '@trezor/theme';

import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from './Text';

type SwitchProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    isDisabled?: boolean; // Functionality of disabled works but styles are not implemented yet (waiting for design)
};

const SWITCH_CONTAINER_BORDER_WIDTH = 1;
const SWITCH_CONTAINER_WIDTH =
    44 * ACCESSIBILITY_FONTSIZE_MULTIPLIER + 2 * SWITCH_CONTAINER_BORDER_WIDTH;
const SWITCH_CONTAINER_HEIGHT =
    24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER + 2 * SWITCH_CONTAINER_BORDER_WIDTH;

const SWITCH_CIRCLE_SIZE = 20 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const SWITCH_CIRCLE_MARGIN = 2 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const SWITCH_CIRCLE_TRACK_WIDTH =
    SWITCH_CONTAINER_WIDTH -
    SWITCH_CIRCLE_SIZE -
    SWITCH_CIRCLE_MARGIN * 2 -
    SWITCH_CONTAINER_BORDER_WIDTH * 2;

const switchContainerStyle = prepareNativeStyle<{ isChecked: boolean }>((utils, { isChecked }) => ({
    height: SWITCH_CONTAINER_HEIGHT,
    width: SWITCH_CONTAINER_WIDTH,
    borderRadius: utils.borders.radii.round,
    flexDirection: 'row',
    borderWidth: SWITCH_CONTAINER_BORDER_WIDTH,
    borderColor: 'transparent',
    extend: [
        {
            condition: !isChecked,
            style: {
                borderColor: utils.colors.borderElevation0,
            },
        },
    ],
}));

const switchCircleStyle = prepareNativeStyle(utils => ({
    width: SWITCH_CIRCLE_SIZE,
    height: SWITCH_CIRCLE_SIZE,
    backgroundColor: palette.darkGray1000,
    borderRadius: utils.borders.radii.round,
    margin: SWITCH_CIRCLE_MARGIN,
    alignSelf: 'center',
}));

const useAnimationStyles = ({ isChecked }: Pick<SwitchProps, 'isChecked'>) => {
    const trackWidth = !isChecked ? 0 : SWITCH_CIRCLE_TRACK_WIDTH;
    const { utils } = useNativeStyles();
    const translateX = useSharedValue(trackWidth);

    useEffect(() => {
        translateX.value = withTiming(trackWidth, {
            duration: 150,
            easing: Easing.out(Easing.cubic),
        });
    }, [trackWidth, translateX]);

    const animatedSwitchCircleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const animatedSwitchContainerStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            translateX.value,
            [0, SWITCH_CIRCLE_TRACK_WIDTH],
            [
                utils.colors.backgroundNeutralSubtleOnElevationNegative,
                utils.colors.backgroundPrimaryDefault,
            ],
        ),
    }));

    return {
        animatedSwitchCircleStyle,
        animatedSwitchContainerStyle,
    };
};

export const Switch = ({ isChecked, onChange, isDisabled = false }: SwitchProps) => {
    const { applyStyle } = useNativeStyles();

    const { animatedSwitchCircleStyle, animatedSwitchContainerStyle } = useAnimationStyles({
        isChecked,
    });

    const handlePress = () => {
        if (isDisabled) return;
        onChange(!isChecked);
    };

    return (
        <Pressable onPress={handlePress} accessibilityRole="switch">
            <Animated.View
                style={[
                    animatedSwitchContainerStyle,
                    applyStyle(switchContainerStyle, { isChecked }),
                ]}
            >
                <Animated.View style={[animatedSwitchCircleStyle, applyStyle(switchCircleStyle)]} />
            </Animated.View>
        </Pressable>
    );
};
