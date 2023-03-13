import {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const SHAKE_BY_DEGREES = 2;
const SHAKE_DURATION = 100;
const INITIAL_ROTATION = '0deg';

export const useShakeAnimation = () => {
    const rotation = useSharedValue(INITIAL_ROTATION);

    const runShakeAnimation = () => {
        rotation.value = withSequence(
            withTiming(`${SHAKE_BY_DEGREES}deg`, { duration: SHAKE_DURATION }),
            withTiming(`-${SHAKE_BY_DEGREES}deg`, { duration: SHAKE_DURATION }),
            withTiming(`${SHAKE_BY_DEGREES / 2}deg`, { duration: SHAKE_DURATION }),
            withTiming(`-${SHAKE_BY_DEGREES / 2}deg`, { duration: SHAKE_DURATION }),
            withSpring(INITIAL_ROTATION),
        );
    };

    const shakeAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: rotation.value,
            },
        ],
    }));

    return { runShakeAnimation, shakeAnimatedStyle };
};
