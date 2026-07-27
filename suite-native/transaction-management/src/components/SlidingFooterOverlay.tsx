import { type ReactNode } from 'react';
import Animated, { SlideOutDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

export type SlidingFooterOverlayProps = {
    activeStepOffset: number;
    children?: ReactNode;
};

const OVERLAY_HEIGHT = 1000;
const GRADIENT_BACKGROUND_HEIGHT = 50;
const SLIDING_FOOTER_OVERLAY_TEST_ID = 'sliding-footer-overlay';

const footerOverlayStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
}));

const contentWrapperStyle = prepareNativeStyle(utils => ({
    flex: 1,
    width: '100%',
    height: OVERLAY_HEIGHT,
    backgroundColor: utils.colors.surfaceFillPage,
}));

const gradientBackgroundStyle = prepareNativeStyle(() => ({
    width: '100%',
    height: GRADIENT_BACKGROUND_HEIGHT,
}));

export const SlidingFooterOverlay = ({ children, activeStepOffset }: SlidingFooterOverlayProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const footerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: withTiming(activeStepOffset) }],
    }));

    return (
        <Animated.View
            style={[footerAnimatedStyle, applyStyle(footerOverlayStyle)]}
            exiting={SlideOutDown}
            testID={SLIDING_FOOTER_OVERLAY_TEST_ID}
        >
            <LinearGradient
                colors={[
                    // 'transparent' color is not working in context of LinearGradient on iOS. RGBA has to be used instead.
                    hexToRgba(utils.colors.surfaceFillPage, 0.01),
                    utils.colors.surfaceFillPage,
                ]}
                style={applyStyle(gradientBackgroundStyle)}
            />
            <Box style={applyStyle(contentWrapperStyle)}>{children}</Box>
        </Animated.View>
    );
};
