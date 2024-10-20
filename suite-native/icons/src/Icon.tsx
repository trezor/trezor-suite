import { useMemo } from 'react';
import { Platform, Text as RNText } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

// @ts-expect-error This is not public RN API but it will make Text noticeable faster https://twitter.com/FernandoTheRojo/status/1707769877493121420
import { NativeText } from 'react-native/Libraries/Text/TextNativeComponent';

import codepoints from '@suite-common/icons/iconFontsMobile/TrezorSuiteIcons.json';
import { useNativeStyles } from '@trezor/styles';
import { Color, Colors, CSSColor } from '@trezor/theme';
import { MOBILE_ICON_FONT_NAME } from '@suite-common/icons';

export type IconColor = Color | CSSColor;
export type AnimatedIconColor = Color | CSSColor | SharedValue<CSSColor>;

export const icons = codepoints;

/**
 * @description If you need to add a new icon, please follow these steps:
 * 1. Add the icon name to the file `generateIconFonts.ts`.
 * 2. Run `yarn generate-icons` to generate the new icon font.
 */
export type IconName = keyof typeof codepoints;

export const iconSizes = {
    extraSmall: 8,
    small: 12,
    medium: 16,
    mediumLarge: 20,
    large: 24,
    extraLarge: 32,
} as const;

export type IconSize = keyof typeof iconSizes;

export const getIconSize = (size: IconSize | number) =>
    typeof size === 'string' ? iconSizes[size] : size;

// NativeText improves the performance of the text rendering, but unfortunately it does not support iOS Accessibility font enlarging.
// Since iOS devices have enough computational power and the text optimization is not crucial, the NativeText is used only for Android.
const DefaultTextComponent: typeof RNText = Platform.select({
    android: NativeText,
    ios: RNText,
});

export type IconProps = {
    name: IconName;
    size?: IconSize | number;
    color?: IconColor;
};

export const Icon = ({ name, size = 'large', color = 'iconDefault' }: IconProps) => {
    const char = String.fromCodePoint(codepoints[name]);
    const sizeNumber = getIconSize(size);
    const {
        utils: { colors },
    } = useNativeStyles();

    const style = useMemo(() => {
        const colorCode = color in colors ? colors[color as Color] : color;

        return {
            fontFamily: MOBILE_ICON_FONT_NAME,
            fontSize: sizeNumber,
            lineHeight: sizeNumber,
            color: colorCode,
        };
    }, [sizeNumber, color, colors]);

    return <DefaultTextComponent style={style}>{char}</DefaultTextComponent>;
};

function isCSSColor(value: any): value is CSSColor {
    'worklet';

    return (
        typeof value === 'string' &&
        (value.startsWith('#') ||
            value.startsWith('rgb(') ||
            value.startsWith('rgba(') ||
            value === 'transparent' ||
            value === 'currentColor')
    );
}

const getColorCode = (color: AnimatedIconColor, themeColors: Colors) => {
    'worklet';
    if (isCSSColor(color)) {
        return color;
    }
    if (typeof color === 'string') {
        return themeColors[color];
    }

    return color.value;
};

type AnimatedIconProps = Omit<IconProps, 'color'> & {
    color?: AnimatedIconColor;
};

// We have two versions of the Icon component, one that is animated and one that should be super fast without animations.
const AnimatedIcon = ({ name, size = 'large', color = 'iconDefault' }: AnimatedIconProps) => {
    const char = String.fromCodePoint(codepoints[name]);
    const {
        utils: { colors },
    } = useNativeStyles();

    const sizeNumber = getIconSize(size);

    const baseStyle = useMemo(
        () => ({
            fontFamily: MOBILE_ICON_FONT_NAME,
            fontSize: sizeNumber,
            lineHeight: sizeNumber,
        }),
        [sizeNumber],
    );

    const style = useAnimatedStyle(() => ({
        color: getColorCode(color, colors),
    }));

    return <Animated.Text style={[baseStyle, style]}>{char}</Animated.Text>;
};

Icon.Animated = AnimatedIcon;
