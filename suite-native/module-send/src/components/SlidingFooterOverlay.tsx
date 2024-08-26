import { useRef, useEffect, ReactNode } from 'react';
import Animated, {
    SlideOutDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@suite-common/suite-utils';

type SlidingFooterOverlayProps = {
    currentStepIndex: number;
    stepHeights: number[];
    children?: ReactNode;
    initialOffset?: number;
    isLayoutReady?: boolean;
};

const OVERLAY_HEIGHT = 1000;
const GRADIENT_BACKGROUND_HEIGHT = 50;

const footerOverlayStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    paddingTop: utils.spacings.large,
    width: '100%',
    height: '100%',
}));

const contentWrapperStyle = prepareNativeStyle(utils => ({
    flex: 1,
    width: '100%',
    height: OVERLAY_HEIGHT,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

const gradientBackgroundStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: GRADIENT_BACKGROUND_HEIGHT,
}));

export const SlidingFooterOverlay = ({
    children,
    currentStepIndex,
    stepHeights,
    initialOffset = 0,
    isLayoutReady = true,
}: SlidingFooterOverlayProps) => {
    const previousStep = useRef<number | null>(null);
    const { applyStyle, utils } = useNativeStyles();
    const footerTranslateY = useSharedValue(initialOffset);

    useEffect(() => {
        if (isLayoutReady && previousStep.current !== currentStepIndex) {
            footerTranslateY.value = withTiming(
                footerTranslateY.value + stepHeights[currentStepIndex],
            );
            previousStep.current = currentStepIndex;
        }
    }, [currentStepIndex, footerTranslateY, stepHeights, isLayoutReady]);

    const footerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: footerTranslateY.value }],
    }));

    return (
        <Animated.View
            style={[footerAnimatedStyle, applyStyle(footerOverlayStyle)]}
            exiting={SlideOutDown}
        >
            <LinearGradient
                colors={[
                    // 'transparent' color is not working in context of LinearGradient on iOS. RGBA has to be used instead.
                    hexToRgba(utils.colors.backgroundSurfaceElevation0, 0.01),
                    utils.colors.backgroundSurfaceElevation0,
                ]}
                style={applyStyle(gradientBackgroundStyle)}
            />
            <Box style={applyStyle(contentWrapperStyle)}>{children}</Box>
        </Animated.View>
    );
};
