import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from './Text';

export type SwitchProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    isDisabled?: boolean;
    testID?: string;
};

const SWITCH_CONTAINER_WIDTH = 44 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const SWITCH_CONTAINER_HEIGHT = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const SWITCH_CIRCLE_SIZE = 20 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const SWITCH_CIRCLE_MARGIN = 2 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const SWITCH_CIRCLE_TRACK_WIDTH =
    SWITCH_CONTAINER_WIDTH - SWITCH_CIRCLE_SIZE - SWITCH_CIRCLE_MARGIN * 2;

const switchContainerStyle = prepareNativeStyle(utils => ({
    height: SWITCH_CONTAINER_HEIGHT,
    width: SWITCH_CONTAINER_WIDTH,
    borderRadius: utils.borders.radii.round,
    flexDirection: 'row',
}));

const switchCircleStyle = prepareNativeStyle(utils => ({
    width: SWITCH_CIRCLE_SIZE,
    height: SWITCH_CIRCLE_SIZE,
    backgroundColor: utils.colors.contentPrimaryInverse,
    borderRadius: utils.borders.radii.round,
    margin: SWITCH_CIRCLE_MARGIN,
    alignSelf: 'center',
}));

const useAnimationStyles = ({
    isChecked,
    isDisabled,
}: Pick<SwitchProps, 'isChecked' | 'isDisabled'>) => {
    const trackWidth = !isChecked ? 0 : SWITCH_CIRCLE_TRACK_WIDTH;
    const { utils } = useNativeStyles();
    const translateX = useSharedValue(trackWidth);

    useEffect(() => {
        translateX.value = withTiming(trackWidth, {
            duration: 150,
            easing: Easing.out(Easing.cubic),
        });
    }, [trackWidth, translateX]);

    const uncheckedColor = isDisabled
        ? utils.colors.elementFillBoldDisabled
        : utils.colors.elementFillNeutralBold;
    const checkedColor = isDisabled
        ? utils.colors.elementFillFieldSelectedDisabled
        : utils.colors.elementFillFieldSelected;

    const animatedSwitchCircleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const animatedSwitchContainerStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            translateX.value,
            [0, SWITCH_CIRCLE_TRACK_WIDTH],
            [uncheckedColor, checkedColor],
        ),
    }));

    return {
        animatedSwitchCircleStyle,
        animatedSwitchContainerStyle,
    };
};

export const Switch = ({ isChecked, onChange, isDisabled = false, testID }: SwitchProps) => {
    const { applyStyle } = useNativeStyles();

    const { animatedSwitchCircleStyle, animatedSwitchContainerStyle } = useAnimationStyles({
        isChecked,
        isDisabled,
    });

    const handlePress = () => {
        if (isDisabled) return;
        onChange(!isChecked);
    };

    return (
        <Pressable onPress={handlePress} accessibilityRole="switch" testID={testID}>
            <Animated.View style={[animatedSwitchContainerStyle, applyStyle(switchContainerStyle)]}>
                <Animated.View style={[animatedSwitchCircleStyle, applyStyle(switchCircleStyle)]} />
            </Animated.View>
        </Pressable>
    );
};
