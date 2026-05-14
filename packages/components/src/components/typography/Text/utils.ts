import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { type TextIntent, type TextPriority } from './types';

const colorMap: Record<Exclude<TextIntent, 'neutral'>, Color> = {
    brand: 'contentBrand',
    info: 'contentInfo',
    warning: 'contentWarning',
    critical: 'contentCritical',
    accentViolet: 'contentAccentViolet',
};

const neutralColorMap: Record<TextPriority, Color> = {
    primary: 'contentPrimary',
    secondary: 'contentSecondary',
};

export const mapIntentToCSS = (
    intent: TextIntent,
    priority: TextPriority,
    isDisabled: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme.contentDisabled;
    }

    const token = intent === 'neutral' ? neutralColorMap[priority] : colorMap[intent];

    return theme[token];
};
