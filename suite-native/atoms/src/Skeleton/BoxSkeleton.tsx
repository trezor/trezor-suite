import React, { useEffect, useMemo } from 'react';
import {
    interpolate,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import {
    Canvas,
    vec,
    RoundedRect,
    LinearGradient,
    Group,
    rrect,
    rect,
} from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color, nativeBorders } from '@trezor/theme';

import { ENDLESS_ANIMATION_VALUE } from '../constants';
import { SurfaceElevation } from '../types';

type BoxSkeletonProps = {
    height: number;
    width: number;
    elevation?: SurfaceElevation;
    borderRadius?: number;
};

const ANIMATION_DURATION = 1200;

const elevationToGradientColors = {
    0: [
        'backgroundSurfaceElevation0',
        'backgroundSurfaceElevationNegative',
        'backgroundSurfaceElevation0',
    ],
    1: [
        'backgroundSurfaceElevation1',
        'backgroundSurfaceElevationNegative',
        'backgroundSurfaceElevation1',
    ],
} as const satisfies Record<SurfaceElevation, Color[]>;

export const BoxSkeleton = ({
    height,
    width,
    elevation = '1',
    borderRadius = nativeBorders.radii.r8,
}: BoxSkeletonProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(width, { duration: ANIMATION_DURATION }),
            ENDLESS_ANIMATION_VALUE,
        );
    }, [width, progress]);

    const position = useDerivedValue(() => [
        {
            translateX: interpolate(progress.value, [0, width], [-width, width]),
        },
    ]);

    const rct = useMemo(() => {
        const coreRect = rect(0, 0, width, height);

        return rrect(coreRect, borderRadius, borderRadius);
    }, [width, height, borderRadius]);

    const gradientColors = useMemo(
        () => elevationToGradientColors[elevation].map(color => colors[color]),
        [colors, elevation],
    );

    return (
        <Canvas style={{ width, height }}>
            <Group clip={rct}>
                <Group transform={position}>
                    <RoundedRect rect={rct}>
                        <LinearGradient
                            start={vec(0, height / 2)}
                            end={vec(width, height / 2)}
                            colors={gradientColors}
                        />
                    </RoundedRect>
                </Group>
            </Group>
        </Canvas>
    );
};
