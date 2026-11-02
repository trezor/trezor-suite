import React, { useEffect, useMemo, useState } from 'react';
import { type AccessibilityProps, View } from 'react-native';
import {
    cancelAnimation,
    interpolate,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import {
    Canvas,
    Group,
    LinearGradient,
    RoundedRect,
    rect,
    rrect,
    vec,
} from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeRadius } from '@trezor/theme';

import { ENDLESS_ANIMATION_VALUE } from '../constants';
import { type SurfaceElevation } from '../types';
import { nativeRadiusToNumber } from '../utils';

type BoxSkeletonProps = {
    height: number;
    width: number | `${number}%`;
    elevation?: SurfaceElevation;
    borderRadius?: NativeRadius | number;
} & AccessibilityProps;

const ANIMATION_DURATION = 1200;

const elevationToGradientColors = {
    0: ['surfaceFillPage', 'surfaceFillSunken', 'surfaceFillPage'],
    1: ['surfaceFillRaised', 'surfaceFillSunken', 'surfaceFillRaised'],
} as const satisfies Record<SurfaceElevation, Color[]>;

const FixedWidthBoxSkeleton = ({
    height,
    width,
    elevation = '1',
    borderRadius = 'r8',
    ...accessibilityProps
}: Omit<BoxSkeletonProps, 'width'> & { width: number }) => {
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

    useEffect(() => () => cancelAnimation(progress), [progress]);

    const position = useDerivedValue(() => [
        {
            translateX: interpolate(progress.value, [0, width], [-width, width]),
        },
    ]);

    const rct = useMemo(() => {
        const coreRect = rect(0, 0, width, height);
        const radius = nativeRadiusToNumber(borderRadius);

        return rrect(coreRect, radius, radius);
    }, [width, height, borderRadius]);

    const gradientColors = useMemo(
        () => elevationToGradientColors[elevation].map(color => colors[color]),
        [colors, elevation],
    );

    return (
        <Canvas style={{ width, height, overflow: 'hidden' }} {...accessibilityProps}>
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

export const BoxSkeleton = ({ width, height, ...props }: BoxSkeletonProps) => {
    const [measuredWidth, setMeasuredWidth] = useState(0);

    if (typeof width === 'number') {
        return <FixedWidthBoxSkeleton width={width} height={height} {...props} />;
    }

    return (
        <View
            style={{ width, height, overflow: 'hidden' }}
            onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}
        >
            {measuredWidth > 0 && (
                <FixedWidthBoxSkeleton width={measuredWidth} height={height} {...props} />
            )}
        </View>
    );
};
