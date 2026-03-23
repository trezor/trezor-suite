import { useCallback } from 'react';
import Animated, { type SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, IconButton } from '@suite-native/atoms';
import { ScreenHeader, useOverrideBackNavigation } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type SwipeableWalkthroughScreenHeaderProps = {
    currentStepIndex: SharedValue<number>;
    CustomBackButton?: typeof SwipeableWalkthroughBackButton;
    onPressBack: () => void;
};

type SwipeableWalkthroughBackButtonProps = {
    onPressBack: () => void;
    currentStepIndex: SharedValue<number>;
};

const ANIMATION_DURATION = 800;

const statusBarStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        zIndex: 2,
        position: 'absolute',
        height: topSafeAreaInset,
        width: '100%',
        backgroundColor: utils.colors.backgroundSurfaceElevation0,
    }),
);

const screenHeaderContainerStyle = prepareNativeStyle(() => ({
    zIndex: 2,
}));

const SwipeableWalkthroughBackButton = ({
    onPressBack,
    currentStepIndex,
}: SwipeableWalkthroughBackButtonProps) => {
    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${currentStepIndex.value === 0 ? 0 : 90}deg`, {
                    duration: ANIMATION_DURATION,
                }),
            },
        ],
    }));

    return (
        <Animated.View style={animatedButtonStyle}>
            <IconButton
                iconName="caretLeft"
                size="medium"
                colorScheme="tertiaryElevation0"
                onPress={onPressBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
            />
        </Animated.View>
    );
};

export const SwipeableWalkthroughScreenHeader = ({
    currentStepIndex,
    CustomBackButton,
    onPressBack,
}: SwipeableWalkthroughScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();

    const BackButton = CustomBackButton || SwipeableWalkthroughBackButton;

    const handlePressBackButton = useCallback(() => {
        if (currentStepIndex.value === 0) {
            onPressBack();
        } else {
            // eslint-disable-next-line react-hooks/immutability
            currentStepIndex.value -= 1;
        }
    }, [currentStepIndex, onPressBack]);

    useOverrideBackNavigation({ onNavigateBack: handlePressBackButton });

    return (
        <>
            {/* Fill the status bar area so that the animated content is not visible while transitioning. */}
            <Box style={applyStyle(statusBarStyle, { topSafeAreaInset })} />
            <Box style={applyStyle(screenHeaderContainerStyle)}>
                <ScreenHeader
                    leftIcon={
                        <BackButton
                            currentStepIndex={currentStepIndex}
                            onPressBack={handlePressBackButton}
                        />
                    }
                />
            </Box>
        </>
    );
};
