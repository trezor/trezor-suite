import { StatusBar } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@react-navigation/native';

import { Box, IconButton } from '@suite-native/atoms';
import { ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
type SwipeableWalkthroughScreenHeaderProps = {
    onPressBack: () => void;
    currentStepIndex: SharedValue<number>;
};

const ANIMATION_DURATION = 800;

const screenHeaderContainerStyle = prepareNativeStyle(utils => ({
    // The negative top offset is necessary to fill the transparent gap between the status bar and the screen header
    // where would be visible the swipeable walkthrough steps animated transitions.
    marginTop: -utils.spacings.sp8,
    paddingTop: utils.spacings.sp8,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    zIndex: 2,
}));

const statusBarStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        zIndex: 2,
        position: 'absolute',
        height: topSafeAreaInset,
        width: '100%',
        backgroundColor: utils.colors.backgroundSurfaceElevation0,
    }),
);

const SwipeableWalkthroughBackButton = ({
    onPressBack,
    currentStepIndex,
}: SwipeableWalkthroughScreenHeaderProps) => {
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
    onPressBack,
    currentStepIndex,
}: SwipeableWalkthroughScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();
    const {
        colors: { background },
        dark,
    } = useTheme();

    return (
        <>
            {/* Status bar can not be transparent same as on the other screens, because then is the animated content visible in in while transitioning. */}
            <Box style={applyStyle(statusBarStyle, { topSafeAreaInset })}>
                <StatusBar
                    backgroundColor={background}
                    barStyle={dark ? 'light-content' : 'dark-content'}
                />
            </Box>
            <Box style={applyStyle(screenHeaderContainerStyle)}>
                <ScreenHeader
                    leftIcon={
                        <SwipeableWalkthroughBackButton
                            currentStepIndex={currentStepIndex}
                            onPressBack={onPressBack}
                        />
                    }
                />
            </Box>
        </>
    );
};
