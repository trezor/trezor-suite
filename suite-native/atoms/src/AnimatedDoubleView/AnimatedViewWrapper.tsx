import { type ReactNode, useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type RenderViewProps = {
    isDisabled?: boolean;
    onPress?: () => void;
};

export type AnimatedViewWrapperProps = {
    renderView: (props: RenderViewProps) => ReactNode;
    focused: boolean;
    handleViewSwitch: () => void;
};

export const ANIMATION_DURATION = 300;
const SCALE_FOCUSED = 1;
const SCALE_UNFOCUSED = 0.9;
const TRANSLATE_Y_FOCUSED = 0;
const TRANSLATE_Y_UNFOCUSED = 55;

const withPredefinedTiming = (toValue: number) =>
    withTiming(toValue, { duration: ANIMATION_DURATION });

const getScale = (focused: boolean) => (focused ? SCALE_FOCUSED : SCALE_UNFOCUSED);
const getTranslateY = (focused: boolean) => (focused ? TRANSLATE_Y_FOCUSED : TRANSLATE_Y_UNFOCUSED);

export const wrapperStyle = prepareNativeStyle<{ focused: boolean }>((_, { focused }) => ({
    position: 'absolute',
    top: focused ? 0 : 2,
    flex: 1,
    width: '100%',
}));

export const AnimatedViewWrapper = ({
    renderView,
    focused,
    handleViewSwitch,
}: AnimatedViewWrapperProps) => {
    const { applyStyle } = useNativeStyles();

    const scale = useSharedValue(getScale(focused));
    const translateY = useSharedValue(getTranslateY(focused));

    useEffect(() => {
        scale.value = withPredefinedTiming(getScale(focused));
        translateY.value = withPredefinedTiming(getTranslateY(focused));

        return () => {
            cancelAnimation(scale);
            cancelAnimation(translateY);
        };
    }, [focused, scale, translateY]);

    const animatedStyle = useAnimatedStyle(
        () => ({
            transform: [{ scale: scale.value }, { translateY: translateY.value }],
            zIndex: focused ? 1 : 0,
        }),
        [focused],
    );

    const onPress = focused ? undefined : handleViewSwitch;

    return (
        <Animated.View style={[applyStyle(wrapperStyle, { focused }), animatedStyle]}>
            <Pressable onPress={onPress}>
                {renderView({
                    isDisabled: !focused,
                    onPress,
                })}
            </Pressable>
        </Animated.View>
    );
};
