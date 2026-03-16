import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { pressTimingConfig } from './constants';

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PressableOpacity = ({ onPress, style, children, ...rest }: PressableProps) => {
    const opacity = useSharedValue(1);
    const fadeOut = () => (opacity.value = withTiming(0.5, pressTimingConfig));
    const fadeIn = () => (opacity.value = withTiming(1, pressTimingConfig));

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={fadeOut}
            onPressOut={fadeIn}
            style={[animatedStyle, style]}
            {...rest}
        >
            {children}
        </AnimatedPressable>
    );
};
