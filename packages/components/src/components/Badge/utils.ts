import { type Color, type TypographyStyle } from '@trezor/theme';

import { type BadgeIntent, type BadgeSize } from './types';
import { type Padding } from '../../utils/frameProps';

export const mapIntentToBackgroundColor = (intent: BadgeIntent): Color => {
    const colorMap: Record<BadgeIntent, Color> = {
        brand: 'backgroundPrimarySubtleOnElevation0',
        neutral: 'backgroundNeutralSubtleOnElevation0',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        critical: 'backgroundAlertRedSubtleOnElevation0',
    };

    return colorMap[intent];
};

export const mapIntentToIconColor = (intent: BadgeIntent): Color => {
    const colorMap: Record<BadgeIntent, Color> = {
        brand: 'iconPrimaryDefault',
        neutral: 'iconSubdued',
        info: 'iconAlertBlue',
        warning: 'iconAlertYellow',
        critical: 'iconAlertRed',
    };

    return colorMap[intent];
};

export const mapSizeToPadding = (size: BadgeSize): Padding => {
    const paddingMap: Record<BadgeSize, Padding> = {
        small: { vertical: 0, horizontal: 8 },
        medium: { vertical: 2, horizontal: 10 },
    };

    return paddingMap[size];
};

export const mapSizeToIconSize = (size: BadgeSize): number => {
    const sizes: Record<BadgeSize, number> = {
        small: 12,
        medium: 16,
    };

    return sizes[size];
};

export const mapSizeToTypographyStyle = (size: BadgeSize): TypographyStyle => {
    const styles: Record<BadgeSize, TypographyStyle> = {
        small: 'body-xs',
        medium: 'body-sm',
    };

    return styles[size];
};
