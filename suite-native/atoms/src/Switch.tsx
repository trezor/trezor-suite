import React, { useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    interpolateColor,
    withTiming,
} from 'react-native-reanimated';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Pressable } from 'react-native';

type SwitchProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    isDisabled?: boolean; // Functionality of disabled works but styles are not implemented yet (waiting for design)
};

const SWITCH_CONTAINER_WIDTH = 44;
const SWITCH_CONTAINER_HEIGHT = 24;
const SWITCH_CIRCLE_SIZE = 20;
const SWITCH_CIRCLE_MARGIN = 2;
const SWITCH_CIRCLE_TRACK_WIDTH =
    SWITCH_CONTAINER_WIDTH - SWITCH_CIRCLE_SIZE - SWITCH_CIRCLE_MARGIN * 2;

const switchContainerStyle = prepareNativeStyle(utils => ({
    width: SWITCH_CONTAINER_WIDTH,
    height: SWITCH_CONTAINER_HEIGHT,
    borderColor: utils.colors.forest,
    borderRadius: utils.borders.radii.round,
    flexDirection: 'row',
}));

const switchCircleStyle = prepareNativeStyle(utils => ({
    width: SWITCH_CIRCLE_SIZE,
    height: SWITCH_CIRCLE_SIZE,
    backgroundColor: utils.colors.white,
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
            [utils.colors.gray400, utils.colors.green],
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
        <Pressable onPress={handlePress}>
            <Animated.View style={[animatedSwitchContainerStyle, applyStyle(switchContainerStyle)]}>
                <Animated.View style={[animatedSwitchCircleStyle, applyStyle(switchCircleStyle)]} />
            </Animated.View>
        </Pressable>
    );
};
