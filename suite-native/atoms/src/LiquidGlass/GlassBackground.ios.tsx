// This is the iOS implementation selected by Metro through the `.ios` filename suffix.
import { StyleSheet } from 'react-native';

import { Host, Spacer } from '@expo/ui/swift-ui';
import { frame, glassEffect } from '@expo/ui/swift-ui/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import type { GlassBackgroundProps } from './GlassBackground.types';
import { isLiquidGlassAvailable } from './isLiquidGlassAvailable';

/**
 * Liquid Glass layer filling its parent. Renders nothing where Liquid Glass is not available, so the
 * parent has to provide its own background in that case (see `isLiquidGlassAvailable`).
 */
export const GlassBackground = (props: GlassBackgroundProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    if (!isLiquidGlassAvailable) return null;

    return (
        <Host
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            // Glass placed near screen edges would otherwise be shrunk by SwiftUI to avoid the safe area.
            ignoreSafeArea="all"
            // Glass follows the app theme rather than the system appearance, which may differ.
            colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
        >
            <Spacer
                modifiers={[
                    frame({ maxWidth: Infinity, maxHeight: Infinity }),
                    glassEffect({
                        glass: { variant: 'regular' },
                        shape: props.shape,
                        cornerRadius: props.shape === 'roundedRectangle' ? props.cornerRadius : 0,
                    }),
                ]}
            />
        </Host>
    );
};
