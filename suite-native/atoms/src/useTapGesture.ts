import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export const useTapGesture = ({
    onPress,
    isDisabled = false,
}: {
    onPress: () => void;
    isDisabled?: boolean;
}) => {
    const isPressed = useSharedValue(false);

    const tapGesture = Gesture.Tap()
        .maxDuration(5000)
        .onBegin(() => {
            isPressed.value = true;
        })
        .onFinalize(() => {
            isPressed.value = false;
        })
        .onTouchesCancelled(() => {
            isPressed.value = false;
        })
        .onEnd(() => {
            if (onPress) {
                runOnJS(onPress)();
            }
        })
        .enabled(!isDisabled);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isPressed.value ? 0.5 : 1, { duration: 100 }),
    }));

    return { tapGesture, animatedStyle };
};
