import { type BorderWidths, type Color } from '@trezor/theme';

import { type IconCircleIntent, type IconCircleSize } from './types';
import { type IconSize } from '../Icon/types';

export const mapIntentToBorderColor = (intent: IconCircleIntent): Color => {
    const colorMap: Record<IconCircleIntent, Color> = {
        brand: 'elementBorderBrandSofter',
        warning: 'elementBorderWarningSofter',
        critical: 'elementBorderCriticalSofter',
        info: 'elementBorderInfoSofter',
        neutral: 'elementBorderNeutralSofter',
        accentViolet: 'elementBorderAccentVioletSofter',
    };

    return colorMap[intent];
};

export const mapSizeToBorderWidth = (size: IconCircleSize): BorderWidths => {
    const borderWidthMap: Record<IconCircleSize, BorderWidths> = {
        16: 0,
        24: 0,
        32: 0,
        40: 0,
        64: 6,
        96: 10,
        112: 12,
    };

    return borderWidthMap[size];
};

export const mapIntentToBackground = (intent: IconCircleIntent, size: IconCircleSize): Color => {
    const noBorderColorMap: Record<IconCircleIntent, Color> = {
        brand: 'elementFillBrandSoft',
        warning: 'elementFillWarningSoft',
        critical: 'elementFillCriticalSoft',
        info: 'elementFillInfoSoft',
        neutral: 'elementFillNeutralSoft',
        accentViolet: 'elementFillAccentVioletSofter',
    };

    const borderColorMap: Record<IconCircleIntent, Color> = {
        brand: 'elementFillBrandSofter',
        warning: 'elementFillWarningSofter',
        critical: 'elementFillCriticalSofter',
        info: 'elementFillInfoSofter',
        neutral: 'elementFillField',
        accentViolet: 'elementFillAccentVioletSoft',
    };

    return (mapSizeToBorderWidth(size) === 0 ? noBorderColorMap : borderColorMap)[intent];
};

export const mapSizeToIconSize = (size: IconCircleSize): IconSize => {
    const iconSizeMap: Record<IconCircleSize, IconSize> = {
        16: 8,
        24: 12,
        32: 20,
        40: 24,
        64: 32,
        96: 40,
        112: 48,
    };

    return iconSizeMap[size];
};
