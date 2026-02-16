import React from 'react';
import { PixelRatio, Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import {
    NativeStyleObject,
    mergeNativeStyleObjects,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles';
import { Color, NativeTypographyStyle } from '@trezor/theme';

import { TestProps } from './types';

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
    titleLarge: TITLE_MAX_FONT_MULTIPLIER,
    titleMedium: TITLE_MAX_FONT_MULTIPLIER,
    titleSmall: TITLE_MAX_FONT_MULTIPLIER,
    highlight: TITLE_MAX_FONT_MULTIPLIER,
    body: TEXT_MAX_FONT_MULTIPLIER,
    callout: TEXT_MAX_FONT_MULTIPLIER,
    hint: TEXT_MAX_FONT_MULTIPLIER,
    label: TEXT_MAX_FONT_MULTIPLIER,
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
            variant = 'body',
            color = 'textDefault',
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
AnimatedText.displayName = 'AnimatedText';
