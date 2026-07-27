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

const inverseColorMap: Record<TextIntent, Color> = {
    brand: 'contentOnDarkBrand',
    neutral: 'contentOnDarkPrimary',
    info: 'contentOnDarkInfo',
    warning: 'contentOnDarkWarning',
    critical: 'contentOnDarkCritical',
    accentViolet: 'contentOnDarkAccentViolet',
};

export const mapIntentToCSS = (
    intent: TextIntent,
    priority: TextPriority,
    isInverse: boolean,
    theme: DefaultTheme,
): CSSColor => {
    const color = theme[(isInverse ? inverseColorMap : colorMap)[intent]];

    return priority === 'primary' ? color : addAlphaToHex(color, 0.74);
};
