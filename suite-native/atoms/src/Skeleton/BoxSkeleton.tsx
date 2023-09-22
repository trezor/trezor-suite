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

export const BoxSkeleton = ({
    height,
    width,
    borderRadius = nativeBorders.radii.small,
}: BoxSkeletonProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();
    const gradientValue = useTiming(
        { from: 0, to: width, loop: true, yoyo: true },
        { easing: Easing.inOut(Easing.linear) },
    );

    const animatedGradientCenter = useComputedValue(
        () => vec(gradientValue.current, height / 2),
        [gradientValue],
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
