import { type Color } from '@trezor/theme';

import { type BannerIntent } from './types';
import { type IconName } from '../Icon/Icon';

export const mapIntentToBackgroundColor = (intent: BannerIntent): Color => {
    const colorMap: Record<BannerIntent, Color> = {
        brand: 'elementFillBrandSofter',
        info: 'elementFillInfoSofter',
        warning: 'elementFillWarningSofter',
        critical: 'elementFillCriticalSofter',
        neutral: 'elementFillNeutralSofter',
    };

    return colorMap[intent];
};

export const mapIntentToBorderColor = (intent: BannerIntent): Color => {
    const colorMap: Record<BannerIntent, Color> = {
        brand: 'elementBorderBrandSofter',
        info: 'elementBorderInfoSofter',
        warning: 'elementBorderWarningSofter',
        critical: 'elementBorderCriticalSofter',
        neutral: 'elementBorderNeutralSofter',
    };

    return colorMap[intent];
};

export const mapIntentToIconColor = (intent: BannerIntent): Color => {
    const colorMap: Record<BannerIntent, Color> = {
        brand: 'contentBrand',
        info: 'contentInfo',
        warning: 'contentWarning',
        critical: 'contentCritical',
        neutral: 'contentPrimary',
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
