import { type ComponentRef, useRef } from 'react';
import { Platform, StyleSheet, type View } from 'react-native';

import { BlurTargetView, BlurView } from 'expo-blur';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { type NativeBlurViewProps } from './NativeBlurViewTypes';

const nativeBlurStyle = prepareNativeStyle<{ isBlurred: boolean; blurIntensity: number }>(
    (_, { isBlurred, blurIntensity }) => {
        // Native filters clip to the view bounds. Reserve room for the halo without changing layout.
        const padding = Math.ceil(blurIntensity * 3);

        return {
            padding,
            margin: -padding,
            filter: isBlurred ? [{ blur: blurIntensity }] : undefined,
        };
    },
);

export const NativeBlurView = ({
    children,
    isBlurred,
    blurIntensity,
    ...props
}: NativeBlurViewProps) => {
    const { applyStyle } = useNativeStyles();
    const targetRef = useRef<ComponentRef<typeof View> | null>(null);

    const isNativeBlurSupported = Platform.OS === 'android' && Platform.Version >= 31;

    if (!isNativeBlurSupported) {
        return (
            <Box {...props}>
                <BlurTargetView ref={targetRef}>{children}</BlurTargetView>
                {isBlurred && (
                    <BlurView
                        testID="blur-fallback"
                        blurTarget={targetRef}
                        // Below Android 12, Expo uses its tint-only fallback without a JS capture.
                        blurMethod="dimezisBlurViewSdk31Plus"
                        // Expo intensity uses a different scale from the native filter radius.
                        intensity={50}
                        blurReductionFactor={4}
                        tint="dark"
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    />
                )}
            </Box>
        );
    }

    return (
        <Box {...props} style={applyStyle(nativeBlurStyle, { isBlurred, blurIntensity })}>
            {children}
        </Box>
    );
};
