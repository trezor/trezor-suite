import { type Color } from '@trezor/theme';

import { type BannerIntent } from './types';
import { type IconName } from '../Icon/Icon';

export const mapIntentToBackgroundColor = (intent: BannerIntent): Color => {
    const colorMap: Record<BannerIntent, Color> = {
        brand: 'legacyBackgroundPrimarySubtleOnElevation0',
        info: 'legacyBackgroundAlertBlueSubtleOnElevation0',
        warning: 'legacyBackgroundAlertYellowSubtleOnElevation0',
        critical: 'legacyBackgroundAlertRedSubtleOnElevation0',
        neutral: 'legacyBackgroundNeutralSubtleOnElevation0',
    };

    return colorMap[intent];
};

export const mapIntentToIconColor = (intent: BannerIntent): Color => {
    const colorMap: Record<BannerIntent, Color> = {
        brand: 'contentBrand',
        info: 'contentInfo',
        warning: 'contentWarning',
        critical: 'contentCritical',
        neutral: 'contentSecondary',
    };

    return colorMap[intent];
};

export const mapIntentToIcon = (intent: BannerIntent): IconName => {
    const iconMap: Record<BannerIntent, IconName> = {
        brand: 'lightbulb',
        info: 'info',
        warning: 'warning',
        critical: 'warning',
        neutral: 'info',
    };

    return iconMap[intent];
};
