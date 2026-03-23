import { type Color } from '@trezor/theme';

import { type ComponentWithSubIconIntent } from './types';

export const mapIntentToBackgroundColor = (intent: ComponentWithSubIconIntent): Color => {
    const colorMap: Record<ComponentWithSubIconIntent, Color> = {
        brand: 'baseFillElementBrandBold',
        neutral: 'baseFillElementContrast',
        info: 'baseFillElementInfoBold',
        warning: 'baseFillElementWarningBold',
        critical: 'baseFillElementNegativeBold',
        accentViolet: 'baseFillElementAccentVioletBold',
        accentOrange: 'baseFillElementAccentOrangeBold',
    };

    return colorMap[intent];
};

export const mapIntentToIconColor = (intent: ComponentWithSubIconIntent): Color => {
    const colorMap: Record<ComponentWithSubIconIntent, Color> = {
        brand: 'baseContentOnActionBrandPrimary',
        neutral: 'baseContentReversePrimary',
        info: 'baseContentOnActionInfoPrimary',
        warning: 'baseContentOnActionWarningPrimary',
        critical: 'baseContentOnActionNegativePrimary',
        accentViolet: 'baseContentOnActionAccentVioletPrimary',
        accentOrange: 'baseContentOnActionAccentOrangePrimary',
    };

    return colorMap[intent];
};
