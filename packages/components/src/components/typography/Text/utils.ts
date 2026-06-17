import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { type TextIntent, type TextPriority } from './types';
import { addAlphaToHex } from '../../../utils/utils';

const colorMap: Record<Exclude<TextIntent, 'neutral'>, Color> = {
    brand: 'contentBrand',
    info: 'contentInfo',
    warning: 'contentWarning',
    critical: 'contentCritical',
    accentViolet: 'contentAccentViolet',
};

const neutralColorMap: Record<TextPriority, Color> = {
    primary: 'contentPrimary',
    secondary: 'contentPrimary',
};

export const mapIntentToCSS = (
    intent: TextIntent,
    priority: TextPriority,
    theme: DefaultTheme,
): CSSColor => {
    const token = intent === 'neutral' ? neutralColorMap[priority] : colorMap[intent];
    const color = theme[token];

    return priority === 'primary' ? color : addAlphaToHex(color, 0.74);
};
