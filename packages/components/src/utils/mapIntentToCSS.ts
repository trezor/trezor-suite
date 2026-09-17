import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color } from '@trezor/theme';

import { addAlphaToHex } from './utils';
import { type UIIntent, type UIPriority } from '../config/types';

type IntentColorPriority = Extract<UIPriority, 'primary' | 'secondary'>;

const colorMap: Record<UIIntent, Color> = {
    brand: 'contentBrand',
    neutral: 'contentPrimary',
    info: 'contentInfo',
    warning: 'contentWarning',
    critical: 'contentCritical',
    accentViolet: 'contentAccentViolet',
};

const inverseColorMap: Record<UIIntent, Color> = {
    brand: 'contentOnDarkBrand',
    neutral: 'contentOnDarkPrimary',
    info: 'contentOnDarkInfo',
    warning: 'contentOnDarkWarning',
    critical: 'contentOnDarkCritical',
    accentViolet: 'contentOnDarkAccentViolet',
};

export const mapIntentToCSS = (
    intent: UIIntent,
    priority: IntentColorPriority,
    isInverse: boolean,
    theme: DefaultTheme,
): CSSColor => {
    const color = theme[(isInverse ? inverseColorMap : colorMap)[intent]];

    return priority === 'primary' ? color : addAlphaToHex(color, 0.74);
};
