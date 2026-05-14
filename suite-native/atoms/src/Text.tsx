import React from 'react';
import {
    PixelRatio,
    Text as RNText,
    type TextProps as RNTextProps,
    type TextStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import {
    type NativeStyleObject,
    mergeNativeStyleObjects,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles-native';
import { type Color, type NativeTypographyStyle } from '@trezor/theme';

import { type TestProps } from './types';

export interface PressableTextProps extends Omit<RNTextProps, 'style'>, TestProps {
    variant?: NativeTypographyStyle;
    color?: Color;
    textAlign?: TextStyle['textAlign'];
    alignSelf?: TextStyle['alignSelf'];
    style?: NativeStyleObject;
}

export type TextProps = PressableTextProps;

type TextStyleProps = {
    variant: NativeTypographyStyle;
    color: Color;
    textAlign: TextStyle['textAlign'];
};

export const TITLE_MAX_FONT_MULTIPLIER = 1.5;
export const TEXT_MAX_FONT_MULTIPLIER = 2;

/**
 * Accessibility inducted enlarging of font sizes is limited to prevent layout overflows.
 * Our UI design is not prepared for unlimited up-scaling.
 */
const variantToMaxFontSizeMultiplier = {
    'headline-lg': TITLE_MAX_FONT_MULTIPLIER,
    'headline-md': TITLE_MAX_FONT_MULTIPLIER,
    'headline-sm': TITLE_MAX_FONT_MULTIPLIER,
    'body-md-strong': TITLE_MAX_FONT_MULTIPLIER,
    'body-md': TEXT_MAX_FONT_MULTIPLIER,
    'body-sm-strong': TEXT_MAX_FONT_MULTIPLIER,
    'body-sm': TEXT_MAX_FONT_MULTIPLIER,
    'body-xs': TEXT_MAX_FONT_MULTIPLIER,
} as const satisfies Record<NativeTypographyStyle, number>;

const getAccessibilityFontScale = (variant?: NativeTypographyStyle) => {
    const fontScale = PixelRatio.getFontScale();

    const maxFontScale = variant
        ? variantToMaxFontSizeMultiplier[variant]
        : TEXT_MAX_FONT_MULTIPLIER;

    return fontScale < maxFontScale ? fontScale : maxFontScale;
};

/**
 * Defines maximal layout scale multiplier based on device accessibility settings.
 */
export const ACCESSIBILITY_FONTSIZE_MULTIPLIER = getAccessibilityFontScale();

const textStyle = prepareNativeStyle<TextStyleProps>((utils, { variant, color, textAlign }) => ({
    ...utils.typography[variant],
    color: utils.colors[color],
    textAlign,
}));

export const Text = React.forwardRef<RNText, TextProps>(
    (
        {
            variant = 'body-md',
            color = 'contentPrimary',
            textAlign = 'left',
            style = {},
            children,
            ...otherProps
        },
        ref,
    ) => {
        const { applyStyle } = useNativeStyles();
        const maxFontSizeMultiplier = getAccessibilityFontScale(variant);

        return (
            <RNText
                style={mergeNativeStyleObjects([
                    applyStyle(textStyle, { variant, color, textAlign }),
                    style,
                ])}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                {...otherProps}
                ref={ref}
            >
                {children}
            </RNText>
        );
    },
);

Text.displayName = 'Text';

export const AnimatedText = Animated.createAnimatedComponent(Text);
