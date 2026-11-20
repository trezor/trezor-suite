import { type ComponentProps, type ReactNode } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView, Card } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type GraphTooltipProps = {
    positionStyle: ComponentProps<typeof AnimatedView>['style'];
    children: ReactNode;
};

const ANIMATION_DURATION = 200;
const TOOLTIP_OFFSET = 25;
const TOOLTIP_MAX_TOP = 100;

export const getGraphTooltipPosition = (x: number, y: number, windowWidth: number) => {
    'worklet';

    // If the point is on the right half of the screen, render the tooltip on its left side
    // to prevent an X axis overflow. Both sides are always set, because an animated style
    // keeps a value that it stops returning.
    const isOnRightHalf = x > windowWidth / 2;

    return {
        left: isOnRightHalf ? ('auto' as const) : x + TOOLTIP_OFFSET,
        right: isOnRightHalf ? windowWidth - x + TOOLTIP_OFFSET : ('auto' as const),
        // The clamping prevents an Y axis overflow.
        top: Math.min(Math.max(y, 0), TOOLTIP_MAX_TOP),
    };
};

const tooltipContainerStyle = prepareNativeStyle(() => ({
    position: 'absolute',
}));

const tooltipCardStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    // fade in/out animation doesn't work for elevation (shadow) on Android
    elevation: 0,
}));

export const GraphTooltip = ({ positionStyle, children }: GraphTooltipProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <AnimatedView
            style={[applyStyle(tooltipContainerStyle), positionStyle]}
            entering={FadeIn.duration(ANIMATION_DURATION)}
            exiting={FadeOut.duration(ANIMATION_DURATION)}
        >
            <Card style={applyStyle(tooltipCardStyle)}>{children}</Card>
        </AnimatedView>
    );
};
