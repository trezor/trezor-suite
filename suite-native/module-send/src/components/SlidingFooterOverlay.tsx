import { ReactNode } from 'react';
import Animated, { SlideOutDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@suite-common/suite-utils';

type SlidingFooterOverlayProps = {
    currentStepIndex: number;
    stepHeights: number[];
    children?: ReactNode;
    initialOffset?: number;
};

const OVERLAY_HEIGHT = 1000;
const GRADIENT_BACKGROUND_HEIGHT = 50;

const footerOverlayStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    paddingTop: utils.spacings.sp24,
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
}: SlidingFooterOverlayProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const footerAnimatedStyle = useAnimatedStyle(() => {
        const topOffset =
            initialOffset +
            stepHeights.slice(0, currentStepIndex).reduce((acc, height) => acc + height, 0);

        return { transform: [{ translateY: withTiming(topOffset) }] };
    });

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
