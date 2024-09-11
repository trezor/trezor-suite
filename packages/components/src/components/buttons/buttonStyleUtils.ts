import { css, useTheme } from 'styled-components';

import { Colors, palette, spacings, spacingsPx } from '@trezor/theme';
import type { UIHorizontalAlignment, UISize, UIVariant } from '../../config/types';
import { hexToRgba } from '@suite-common/suite-utils';

const SUBTLE_ALPHA = 0.12;
const SUBTLE_ALPHA_HOVER = 0.2;

export const subtleButtonVariants = ['info', 'warning', 'destructive'] as const;

export const buttonVariants = ['primary', 'tertiary', ...subtleButtonVariants] as const;

export type ButtonVariant = Extract<UIVariant, (typeof buttonVariants)[number]>;

export const buttonSizes: Array<UISize> = ['large', 'medium', 'small', 'tiny'];
export type ButtonSize = Extract<UISize, (typeof buttonSizes)[number]>;

export type IconAlignment = Extract<UIHorizontalAlignment, 'left' | 'right'>;

export const getPadding = (size: ButtonSize, hasLabel?: boolean) => {
    const map: Record<ButtonSize, string> = {
        small: hasLabel ? `${spacingsPx.xs} ${spacingsPx.md}` : '10px',
        large: hasLabel ? `${spacingsPx.md} ${spacingsPx.xl}` : `${spacingsPx.md}`,
        medium: hasLabel ? `${spacingsPx.sm} ${spacingsPx.lg}` : '14px',
        tiny: hasLabel ? `${spacingsPx.xxxs} ${spacingsPx.xs}` : '6px',
    };

    return map[size];
};

export const getIconColor = ({
    variant,
    isDisabled,
    theme,
    isSubtle,
}: {
    variant: ButtonVariant;
    isDisabled: boolean;
    theme: Colors;
    isSubtle: boolean;
}) => {
    if (isDisabled) {
        return theme.iconDisabled;
    }

    switch (variant) {
        case 'primary':
            return theme.iconOnPrimary;
        case 'tertiary':
            return theme.iconOnTertiary;
        case 'info':
            return isSubtle ? theme.iconAlertBlue : theme.iconOnBlue;
        case 'warning':
            return isSubtle ? theme.iconAlertYellow : theme.iconOnYellow;
        case 'destructive':
            return isSubtle ? theme.iconAlertRed : theme.iconOnRed;
        // no default
    }
};

export const getIconSize = (size: ButtonSize) => {
    switch (size) {
        case 'large':
            return spacings.xl;
        case 'medium':
            return spacings.lg;
        case 'small':
            return spacings.md;
        case 'tiny':
            return spacings.sm;

        default:
            return spacings.xl;
    }
};

export const useVariantStyle = (
    variant: ButtonVariant,
    isSubtle: boolean,
): ReturnType<typeof css> => {
    const theme = useTheme();
    const isDarkMode = theme.mode === 'dark';

    const variantsColors: Record<ButtonVariant, Record<string, string | Colors>> = {
        primary: {
            background: theme.backgroundPrimaryDefault,
            backgroundHover: theme.backgroundPrimaryPressed,
            text: theme.textOnPrimary,
        },
        tertiary: {
            // temporary hack until colors are properly defined
            background: isDarkMode
                ? hexToRgba(palette.lightWhiteAlpha1000, 0.16)
                : hexToRgba(palette.lightGray1000, 0.12),
            backgroundHover: isDarkMode
                ? hexToRgba(palette.lightWhiteAlpha1000, 0.24)
                : hexToRgba(palette.lightGray1000, 0.16),
            text: theme.textOnTertiary,
        },
        info: {
            background: theme.backgroundAlertBlueBold,
            backgroundSubtle: hexToRgba(theme.backgroundAlertBlueBold, SUBTLE_ALPHA),
            backgroundHover: theme.backgroundAlertBlueBoldAlt,
            backgroundSubtleHover: hexToRgba(theme.backgroundAlertBlueBoldAlt, SUBTLE_ALPHA_HOVER),
            text: theme.textOnBlue,
            textSubtle: theme.textAlertBlue,
        },
        warning: {
            background: theme.backgroundAlertYellowBold,
            backgroundSubtle: hexToRgba(theme.backgroundAlertYellowBold, SUBTLE_ALPHA),
            backgroundHover: theme.backgroundAlertYellowBoldAlt,
            backgroundSubtleHover: hexToRgba(
                theme.backgroundAlertYellowBoldAlt,
                SUBTLE_ALPHA_HOVER,
            ),
            text: theme.textOnYellow,
            textSubtle: theme.textAlertYellow,
        },
        destructive: {
            background: theme.backgroundAlertRedBold,
            backgroundSubtle: hexToRgba(theme.backgroundAlertRedBold, SUBTLE_ALPHA),
            backgroundHover: theme.backgroundAlertRedBoldAlt,
            backgroundSubtleHover: hexToRgba(theme.backgroundAlertRedBoldAlt, SUBTLE_ALPHA_HOVER),
            text: theme.textOnRed,
            textSubtle: theme.textAlertRed,
        },
    };

    const colors = variantsColors[variant];

    return css`
        background: ${isSubtle && colors.backgroundSubtle
            ? colors.backgroundSubtle
            : colors.background};
        color: ${isSubtle && colors.textSubtle ? colors.textSubtle : colors.text};

        &:hover,
        &:active {
            background: ${isSubtle && colors.backgroundSubtleHover
                ? colors.backgroundSubtleHover
                : colors.backgroundHover};
        }
    `;
};
