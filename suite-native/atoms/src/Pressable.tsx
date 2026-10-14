import { type PressableProps } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedPressable } from './Animated/AnimatedPressable';
import { pressTimingConfig } from './constants';

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
