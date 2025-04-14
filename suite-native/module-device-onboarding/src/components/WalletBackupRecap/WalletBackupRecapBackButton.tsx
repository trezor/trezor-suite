import Animated, {
    SharedValue,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { IconButton } from '@suite-native/atoms';
type SwipeableWalkthroughScreenHeaderProps = {
    onPressBack: () => void;
    currentStepIndex: SharedValue<number>;
};

const ANIMATION_DURATION = 500;

export const WalletBackupRecapBackButton = ({
    onPressBack,
    currentStepIndex,
}: SwipeableWalkthroughScreenHeaderProps) => {
    const xPaddingBottom = useDerivedValue(() =>
        withTiming(currentStepIndex.value === 0 ? 0 : 3, { duration: ANIMATION_DURATION / 2 }),
    );

    const xOpacity = useDerivedValue(() =>
        withTiming(currentStepIndex.value === 0 ? 1 : 0, {
            duration: ANIMATION_DURATION / (currentStepIndex.value === 0 ? 4 : 1),
        }),
    );

    const caretOpacity = useDerivedValue(() =>
        withTiming(currentStepIndex.value === 0 ? 0 : 1, { duration: ANIMATION_DURATION }),
    );

    const animatedXStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        opacity: xOpacity.value,
        paddingBottom: xPaddingBottom.value,
    }));

    const animatedCaretStyle = useAnimatedStyle(() => ({
        opacity: caretOpacity.value,
    }));

    return (
        <Animated.View>
            <IconButton
                iconName="caretUp"
                size="medium"
                colorScheme="tertiaryElevation0"
                onPress={onPressBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={animatedCaretStyle}
            />
            <IconButton
                style={animatedXStyle}
                iconName="x"
                size="medium"
                colorScheme="tertiaryElevation0"
                onPress={onPressBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
            />
        </Animated.View>
    );
};
