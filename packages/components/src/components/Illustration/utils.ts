import { type Color } from '@trezor/theme';

import { type IllustrationIntent } from './types';

export const mapIntentToBorderColor = (intent: IllustrationIntent): Color => {
    const colorMap: Record<IllustrationIntent, Color> = {
        brand: 'illustrationBorderBrand',
        info: 'illustrationBorderInfo',
        critical: 'illustrationBorderCritical',
        warning: 'illustrationBorderWarning',
    };

    return colorMap[intent];
};

export const mapIntentToFillColor = (intent: IllustrationIntent): Color => {
    const colorMap: Record<IllustrationIntent, Color> = {
        brand: 'illustrationFillBrand',
        info: 'illustrationFillInfo',
        critical: 'illustrationFillCritical',
        warning: 'illustrationFillWarning',
    };

    return colorMap[intent];
};
