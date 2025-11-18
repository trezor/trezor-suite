import { DefaultTheme } from 'styled-components';

import { CSSColor } from '@trezor/theme';

import { IconVariant } from './types';

export const mapVariantToColor = (
    theme: DefaultTheme,
    isDisabled: boolean,
    variant?: IconVariant,
): CSSColor => {
    if (isDisabled) {
        return theme.iconDisabled;
    }

    const colorMap: Record<IconVariant, CSSColor> = {
        primary: theme.iconPrimaryDefault,
        tertiary: theme.iconSubdued,
        info: theme.iconAlertBlue,
        warning: theme.iconAlertYellow,
        destructive: theme.iconAlertRed,
        default: theme.iconDefault,
    };

    return variant ? colorMap[variant] : 'currentColor';
};
