import { useEffect, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { AnimatedBox } from './AnimatedBox';
import { Box, type BoxProps } from '../Box';

const FADE_DURATION = 150;
const RESIZE_DURATION = 250;
// Progress runs from 1 (shown) to 0 (collapsed): it fades out first, then gives its height back.
const FADED_OUT_PROGRESS = RESIZE_DURATION / (FADE_DURATION + RESIZE_DURATION);

export type CollapsibleBoxProps = BoxProps & {
    isCollapsed: boolean;
};

/**
 * Fades out and then collapses its height when `isCollapsed` turns on, so content below slides
 * up instead of jumping, and unmounts its children once collapsed.
 */
export const CollapsibleBox = ({ isCollapsed, children, ...boxProps }: CollapsibleBoxProps) => {
    const [isContentRendered, setIsContentRendered] = useState(!isCollapsed);
    const progress = useSharedValue(isCollapsed ? 0 : 1);
    const contentHeight = useSharedValue(0);

    useEffect(() => {
        progress.set(
            withTiming(
                isCollapsed ? 0 : 1,
                { duration: FADE_DURATION + RESIZE_DURATION },
                isFinished => {
                    if (isFinished) {
                        runOnJS(setIsContentRendered)(!isCollapsed);
                    }
                },
            ),
        );
    }, [isCollapsed, progress]);

    const animatedStyle = useAnimatedStyle(() =>
        progress.value === 1
            ? {}
            : {
                  opacity: interpolate(
                      progress.value,
                      [FADED_OUT_PROGRESS, 1],
                      [0, 1],
                      Extrapolation.CLAMP,
                  ),
                  height: interpolate(
                      progress.value,
                      [0, FADED_OUT_PROGRESS],
                      [0, contentHeight.value],
                      Extrapolation.CLAMP,
                  ),
                  overflow: 'hidden',
              },
    );

    const handleContentLayout = (event: LayoutChangeEvent) =>
        contentHeight.set(event.nativeEvent.layout.height);

    if (isCollapsed && !isContentRendered) {
        return null;
    }

    return (
        // On Android, fading a card with an elevation shadow shows the shadow through the card
        // unless both are composited into one layer first.
        <AnimatedBox
            style={animatedStyle}
            needsOffscreenAlphaCompositing
            renderToHardwareTextureAndroid
        >
            <Box {...boxProps} onLayout={handleContentLayout}>
                {children}
            </Box>
        </AnimatedBox>
    );
};
