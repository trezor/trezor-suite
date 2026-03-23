import { useMemo } from 'react';
import { Text, type TextProps } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { MOBILE_ICON_FONT_NAME } from '@suite-common/icons';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import codepoints from '@suite-common/icons/iconFontsMobile/TrezorSuiteIcons.json';
import { useNativeStyles } from '@trezor/styles-native';
import { type CSSColor, type Color, type Colors } from '@trezor/theme';

export type IconColor = Color | CSSColor;
export type AnimatedIconColor = Color | CSSColor | SharedValue<CSSColor>;

export const icons = codepoints;

// Limit the maximum font size multiplier to 1.5 to prevent layout issues if the user has accessibility font size settings set to maximum.
export const MAX_FONT_SIZE_MULTIPLIER = 1.5;

/**
 * @description If you need to add a new icon, please follow these steps:
 * 1. Add the icon name to the file `generateIconFont.ts`.
 * 2. Run `yarn generate-icons` to generate the new icon font.
 */
export type IconName = keyof typeof codepoints;
export const ICON_NAMES = Object.keys(codepoints) as IconName[];

export const iconSizes = {
    extraSmall: 8,
    small: 12,
    medium: 16,
    mediumLarge: 20,
    large: 24,
    extraLarge: 32,
} as const;

export const ICON_SIZES = Object.keys(iconSizes) as IconSize[];
export type IconSize = keyof typeof iconSizes;

export const getIconSize = (size: IconSize | number) =>
    typeof size === 'string' ? iconSizes[size] : size;

export type IconProps = {
    name: IconName;
    size?: IconSize | number;
    color?: IconColor;
} & Omit<TextProps, 'children'>;

export const Icon = ({ name, size = 'large', color = 'iconDefault', ...props }: IconProps) => {
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

    return (
        <Text style={style} {...props} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>
            {char}
        </Text>
    );
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
const AnimatedIcon = ({
    name,
    size = 'large',
    color = 'iconDefault',
    ...props
}: AnimatedIconProps) => {
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

    return (
        <Animated.Text
            style={[baseStyle, style]}
            {...props}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        >
            {char}
        </Animated.Text>
    );
};

Icon.Animated = AnimatedIcon;
