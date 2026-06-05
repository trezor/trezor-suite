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
    isDisabled: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme.contentDisabled;
    }

    const token = theme[colorMap[intent]];

    return priority === 'primary' ? token : addAlphaToHex(token, 0.74);
};
