import { LinearGradient } from 'expo-linear-gradient';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

const screenTopEdgeFadeStyle = prepareNativeStyle<{ height: number }>((_, { height }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height,
    pointerEvents: 'none',
}));

type ScreenTopEdgeFadeProps = {
    // Part of the fade that stays (almost) opaque, e.g. to keep the status bar legible.
    solidHeight: number;
    fadeHeight: number;
    backgroundColor?: Color;
};

/**
 * Softens the edge where scrolled content disappears under the status bar and a floating header.
 */
export const ScreenTopEdgeFade = ({
    solidHeight,
    fadeHeight,
    backgroundColor = 'surfaceFillPage',
}: ScreenTopEdgeFadeProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const height = solidHeight + fadeHeight;
    // 'transparent' color does not work in context of LinearGradient on iOS, RGBA has to be used instead.
    const backgroundCSSColor = utils.colors[backgroundColor];

    if (height <= 0) return null;

    return (
        <LinearGradient
            colors={[
                backgroundCSSColor,
                hexToRgba(backgroundCSSColor, 0.8),
                hexToRgba(backgroundCSSColor, 0.01),
            ]}
            locations={[0, solidHeight / height, 1]}
            style={applyStyle(screenTopEdgeFadeStyle, { height })}
        />
    );
};
