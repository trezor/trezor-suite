import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { type TextIntent, type TextPriority } from './types';
import { addAlphaToHex } from '../../../utils/utils';

const colorMap: Record<TextIntent, Color> = {
    brand: 'contentBrand',
    neutral: 'contentPrimary',
    info: 'contentInfo',
    warning: 'contentWarning',
    critical: 'contentCritical',
    accentViolet: 'contentAccentViolet',
};

export const mapIntentToCSS = (
    intent: TextIntent,
    priority: TextPriority,
    theme: DefaultTheme,
): CSSColor => {
    const color = theme[colorMap[intent]];

    return priority === 'primary' ? color : addAlphaToHex(color, 0.74);
};
