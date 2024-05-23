import { View } from 'react-native';
import {
    measure,
    useAnimatedRef,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const ANIMATION_DURATION = 200;

export const useAccordionAnimation = () => {
    const animatedRef = useAnimatedRef<View>();
    const isOpen = useSharedValue(false);
    const height = useSharedValue(0);

    const animatedHeightStyle = useAnimatedStyle(() => ({
        height: withTiming(height.value, { duration: ANIMATION_DURATION }),
    }));

    const setHeight = () => {
        'worklet';

        height.value = !height.value ? Number(measure(animatedRef)?.height ?? 0) : 0;
        isOpen.value = !isOpen.value;
    };

    const animatedChevronStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${isOpen.value ? 90 : 0}deg`, {
                    duration: ANIMATION_DURATION,
                }),
            },
        ],
    }));

    return { animatedRef, setHeight, isOpen, animatedHeightStyle, animatedChevronStyle };
};
