import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { type IconIntent, type IconPriority } from './types';

const colorMap: Record<Exclude<IconIntent, 'neutral'>, Color> = {
    brand: 'contentBrand',
    info: 'contentInfo',
    warning: 'contentWarning',
    critical: 'contentCritical',
    accentViolet: 'contentAccentViolet',
};

const neutralColorMap: Record<IconPriority, Color> = {
    primary: 'contentPrimary',
    secondary: 'contentSecondary',
};

export const mapIntentToCSS = (
    intent: IconIntent,
    priority: IconPriority,
    isDisabled: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme.contentDisabled;
    }

    const token = intent === 'neutral' ? neutralColorMap[priority] : colorMap[intent];

    return theme[token];
};
