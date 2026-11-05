import { useContext } from 'react';
import { PixelRatio, Platform } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { BlurContext } from '../Blur/BlurContext';
import { Text, type TextProps } from '../Text';

const blurredTextStyle = prepareNativeStyle<{ color: Color; blurIntensity: number }>(
    (utils, { color, blurIntensity }) => ({
        // Fully transparent inline text inherits the parent color on Android.
        color: '#00000001',
        textShadowColor: utils.colors[color],
        textShadowOffset: { width: 0, height: 0 },
        // Android's text shadow radius is in pixels; iOS uses layout points.
        textShadowRadius:
            Platform.OS === 'android'
                ? PixelRatio.getPixelSizeForLayoutSize(blurIntensity)
                : blurIntensity,
    }),
);

export type BlurTextProps = TextProps & {
    children: string;
    isBlurred?: boolean;
    /** Overrides the default radius of 35% of the text's font size, in layout points. */
    blurIntensity?: number;
};

/** Blurs inline text while preserving native wrapping, truncation and baseline alignment. */
export const BlurText = ({
    children,
    isBlurred = true,
    blurIntensity,
    variant = 'body-md',
    color = 'contentPrimary',
    style = {},
    ...props
}: BlurTextProps) => {
    const isBlurredByParent = useContext(BlurContext);
    const {
        applyStyle,
        utils: { typography },
    } = useNativeStyles();
    const shouldBlur = isBlurred && !isBlurredByParent;
    const textBlurIntensity =
        blurIntensity ?? (style.fontSize ?? typography[variant].fontSize) * 0.35;

    return (
        <Text
            {...props}
            variant={variant}
            color={color}
            accessibilityElementsHidden={shouldBlur}
            importantForAccessibility={shouldBlur ? 'no-hide-descendants' : 'auto'}
            style={{
                ...style,
                ...(shouldBlur
                    ? applyStyle(blurredTextStyle, { color, blurIntensity: textBlurIntensity })
                    : {}),
            }}
        >
            {children}
        </Text>
    );
};
