import { type BorderWidths, type Color } from '@trezor/theme';

import { type IconCircleIntent, type IconCircleSize } from './types';
import { type IconSize } from '../Icon/types';

export const mapIntentToBorderColor = (intent: IconCircleIntent): Color => {
    const colorMap: Record<IconCircleIntent, Color> = {
        brand: 'legacyBackgroundPrimarySubtleOnElevation0',
        warning: 'legacyBackgroundAlertYellowSubtleOnElevation0',
        critical: 'legacyBackgroundAlertRedSubtleOnElevation0',
        info: 'legacyBackgroundAlertBlueSubtleOnElevation0',
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
        96: 10,
        112: 12,
    };

    return borderWidthMap[size];
};

export const mapIntentToBackground = (intent: IconCircleIntent, size: IconCircleSize): Color => {
    const noBorderColorMap: Record<IconCircleIntent, Color> = {
        brand: 'legacyBackgroundPrimarySubtleOnElevation0',
        warning: 'legacyBackgroundAlertYellowSubtleOnElevation0',
        critical: 'legacyBackgroundAlertRedSubtleOnElevation0',
        info: 'legacyBackgroundAlertBlueSubtleOnElevation0',
        neutral: 'elementFillNeutralSofter',
        accentViolet: 'elementFillAccentVioletSofter',
    };

    const borderColorMap: Record<IconCircleIntent, Color> = {
        brand: 'legacyBackgroundPrimarySubtleOnElevation1',
        warning: 'legacyBackgroundAlertYellowSubtleOnElevation1',
        critical: 'legacyBackgroundAlertRedSubtleOnElevation1',
        info: 'legacyBackgroundAlertBlueSubtleOnElevation1',
        neutral: 'elementFillField',
        accentViolet: 'elementFillAccentVioletSoft',
    };

    return (mapSizeToBorderWidth(size) === 0 ? noBorderColorMap : borderColorMap)[intent];
};

export const mapSizeToIconSize = (size: IconCircleSize): IconSize => {
    const iconSizeMap: Record<IconCircleSize, IconSize> = {
        16: 8,
        24: 12,
        32: 16,
        40: 20,
        96: 40,
        112: 48,
    };

    return iconSizeMap[size];
};
