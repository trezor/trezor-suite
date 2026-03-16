import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { type TextIntent, type TextPriority } from './types';

const colorMap: Record<Exclude<TextIntent, 'neutral'>, Color> = {
    brand: 'textPrimaryDefault',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    critical: 'textAlertRed',
    accentViolet: 'baseContentAccentViolet',
    accentOrange: 'baseContentAccentOrange',
};

const neutralColorMap: Record<TextPriority, Color> = {
    primary: 'textDefault',
    secondary: 'textSubdued',
};

export const mapIntentToCSS = (
    intent: TextIntent,
    priority: TextPriority,
    isDisabled: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme.textDisabled;
    }

    const token = intent === 'neutral' ? neutralColorMap[priority] : colorMap[intent];

    return theme[token];
};
