import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { type IconIntent, type IconPriority } from './types';
import { addAlphaToHex } from '../../utils/utils';

const colorMap: Record<IconIntent, Color> = {
    neutral: 'contentPrimary',
    brand: 'contentBrand',
    info: 'contentInfo',
    warning: 'contentWarning',
    critical: 'contentCritical',
    accentViolet: 'contentAccentViolet',
};

const inverseColorMap: Record<IconIntent, Color> = {
    neutral: 'contentOnDarkPrimary',
    brand: 'contentOnDarkBrand',
    info: 'contentOnDarkInfo',
    warning: 'contentOnDarkWarning',
    critical: 'contentOnDarkCritical',
    accentViolet: 'contentOnDarkAccentViolet',
};

export const mapIntentToCSS = (
    intent: IconIntent,
    priority: IconPriority,
    isInverse: boolean,
    isDisabled: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme.contentDisabled;
    }

    const color = theme[(isInverse ? inverseColorMap : colorMap)[intent]];

    return priority === 'primary' ? color : addAlphaToHex(color, 0.74);
};
