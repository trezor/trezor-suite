import { type Color } from '@trezor/theme';

import { type BannerIntent } from './types';
import { type IconName } from '../Icon/Icon';

export const mapIntentToBackgroundColor = (intent: BannerIntent): Color => {
    const colorMap: Record<BannerIntent, Color> = {
        brand: 'backgroundPrimarySubtleOnElevation0',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        critical: 'backgroundAlertRedSubtleOnElevation0',
        neutral: 'backgroundNeutralSubtleOnElevation0',
    };

    return colorMap[intent];
};

export const mapIntentToIconColor = (intent: BannerIntent): Color => {
    const colorMap: Record<BannerIntent, Color> = {
        brand: 'iconPrimaryDefault',
        info: 'iconAlertBlue',
        warning: 'iconAlertYellow',
        critical: 'iconAlertRed',
        neutral: 'iconSubdued',
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
