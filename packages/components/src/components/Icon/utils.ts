import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { type IconIntent, type IconPriority } from './types';

const colorMap: Record<Exclude<IconIntent, 'neutral'>, Color> = {
    brand: 'iconPrimaryDefault',
    info: 'iconAlertBlue',
    warning: 'iconAlertYellow',
    critical: 'iconAlertRed',
    accentViolet: 'baseContentAccentViolet',
    accentOrange: 'baseContentAccentOrange',
};

const neutralColorMap: Record<IconPriority, Color> = {
    primary: 'iconDefault',
    secondary: 'iconSubdued',
};

export const mapIntentToCSS = (
    intent: IconIntent,
    priority: IconPriority,
    isDisabled: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme.iconDisabled;
    }

    const token = intent === 'neutral' ? neutralColorMap[priority] : colorMap[intent];

    return theme[token];
};
