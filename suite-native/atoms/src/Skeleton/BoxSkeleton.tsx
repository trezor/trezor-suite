import React from 'react';
import { Easing } from 'react-native-reanimated';

import {
    Canvas,
    useComputedValue,
    vec,
    useTiming,
    RoundedRect,
    RadialGradient,
} from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { nativeBorders } from '@trezor/theme';

type BoxSkeletonProps = {
    height: number;
    width: number;
    borderRadius?: number;
};

const GRADIENT_OFFSET_DIVISOR = 8;
const ANIMATION_DURATION = 1200;

export const BoxSkeleton = ({
    height,
    width,
    borderRadius = nativeBorders.radii.s,
}: BoxSkeletonProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    // Offsetting the gradient center horizontally behind the rounded rect edges make the animations look smoother.
    const gradientHorizontalOffset = width / GRADIENT_OFFSET_DIVISOR;

    const gradientCenterHorizontalValue = useTiming(
        { from: -gradientHorizontalOffset, to: width + gradientHorizontalOffset, loop: true },
        { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.linear) },
    );

    const animatedGradientCenter = useComputedValue(
        () => vec(gradientCenterHorizontalValue.current, height / 2),
        [gradientCenterHorizontalValue],
    );

    return (
        <Canvas style={{ width, height }}>
            <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
                <RadialGradient
                    c={animatedGradientCenter}
                    r={width}
                    colors={[
                        colors.backgroundSurfaceElevationNegative,
                        colors.backgroundSurfaceElevation1,
                    ]}
                />
            </RoundedRect>
        </Canvas>
    );
};
