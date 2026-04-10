import { type Color } from '@trezor/theme';

import { type ComponentWithSubIconIntent } from './types';

export const mapIntentToBackgroundColor = (intent: ComponentWithSubIconIntent): Color => {
    const colorMap: Record<ComponentWithSubIconIntent, Color> = {
        brand: 'elementFillBrandBold',
        neutral: 'elementFillContrast',
        info: 'elementFillInfoBold',
        warning: 'elementFillWarningBold',
        critical: 'elementFillCriticalBold',
        accentViolet: 'elementFillAccentVioletBold',
    };

    return colorMap[intent];
};

export const mapIntentToIconColor = (intent: ComponentWithSubIconIntent): Color => {
    const colorMap: Record<ComponentWithSubIconIntent, Color> = {
        brand: 'contentButtonBrandPrimary',
        neutral: 'contentPrimaryInverse',
        info: 'contentButtonInfoPrimary',
        warning: 'contentButtonWarningPrimary',
        critical: 'contentButtonCriticalPrimary',
        accentViolet: 'contentButtonAccentVioletPrimary',
    };

    return colorMap[intent];
};
