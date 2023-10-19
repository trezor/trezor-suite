import { Text as RNText, TextProps as RNTextProps, TextStyle, PixelRatio } from 'react-native';

import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color, TypographyStyle } from '@trezor/theme';

import { TestProps } from './types';

export interface TextProps extends Omit<RNTextProps, 'style'>, TestProps {
    variant?: TypographyStyle;
    color?: Color;
    textAlign?: TextStyle['textAlign'];
    style?: NativeStyleObject;
}

type TextStyleProps = {
    variant: TypographyStyle;
    color: Color;
    textAlign: TextStyle['textAlign'];
};

export const TITLE_MAX_FONT_MULTIPLIER = 1.5;
export const TEXT_MAX_FONT_MULTIPLIER = 2;

const getAccessibilityFontScale = () => {
    const fontScale = PixelRatio.getFontScale();
    return fontScale < TEXT_MAX_FONT_MULTIPLIER ? fontScale : TEXT_MAX_FONT_MULTIPLIER;
};

/**
 * Defines maximal layout scale multiplier based on device accessibility settings.
 */
export const ACCESSIBILITY_FONTSIZE_MULTIPLIER = getAccessibilityFontScale();

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
} as const satisfies Record<TypographyStyle, number>;

const textStyle = prepareNativeStyle<TextStyleProps>((utils, { variant, color, textAlign }) => ({
    ...utils.typography[variant],
    color: utils.colors[color],
    textAlign,
}));

export const Text = ({
    variant = 'body',
    color = 'textDefault',
    textAlign = 'left',
    style,
    children,
    ...otherProps
}: TextProps) => {
    const { applyStyle } = useNativeStyles();
    const maxFontSizeMultiplier = variantToMaxFontSizeMultiplier[variant];
    return (
        <RNText
            style={[applyStyle(textStyle, { variant, color, textAlign }), style]}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            {...otherProps}
        >
            {children}
        </RNText>
    );
};
