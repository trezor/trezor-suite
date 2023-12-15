import { TextProps as RNTextProps, Text as RNText, TextStyle, PixelRatio } from 'react-native';

// @ts-expect-error This is not public RN API but I will make Text noticeable faster https://twitter.com/FernandoTheRojo/status/1707769877493121420
import { NativeText } from 'react-native/Libraries/Text/TextNativeComponent';

import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color, TypographyStyle } from '@trezor/theme';

import { TestProps } from './types';

export interface PressableTextProps extends Omit<RNTextProps, 'style'>, TestProps {
    variant?: TypographyStyle;
    color?: Color;
    textAlign?: TextStyle['textAlign'];
    style?: NativeStyleObject;
}
type UnsupportedNativeTextProps =
    | 'pressRetentionOffset'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'onPressOut';

export type TextProps = Omit<PressableTextProps, UnsupportedNativeTextProps>;

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

export const BaseText = ({
    variant = 'body',
    color = 'textDefault',
    textAlign = 'left',
    TextComponent = NativeText,
    style,
    children,
    ...otherProps
}: TextProps & { TextComponent: typeof RNText }) => {
    const { applyStyle } = useNativeStyles();
    const maxFontSizeMultiplier = variantToMaxFontSizeMultiplier[variant];
    return (
        <NativeText
            style={[applyStyle(textStyle, { variant, color, textAlign }), style]}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            {...otherProps}
        >
            {children}
        </NativeText>
    );
};

export const Text = (props: TextProps) => <BaseText {...props} TextComponent={NativeText} />;
Text.Pressable = (props: PressableTextProps) => <BaseText {...props} TextComponent={RNText} />;
