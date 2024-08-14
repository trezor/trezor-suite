import { Color, CSSColor, Elevation, mapElevationToBackgroundToken } from '@trezor/theme';
import { WarningVariant } from './types';
import { IconType } from '../Icon/Icon';
import { DefaultTheme } from 'styled-components';

type MapArgs = {
    $variant: WarningVariant;
    theme: DefaultTheme;
    $elevation: Elevation;
};

export const mapVariantToBackgroundColor = ({ $variant, theme, $elevation }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        secondary: 'backgroundNeutralBold',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
        tertiary: mapElevationToBackgroundToken({ $elevation }),
    };

    return theme[colorMap[$variant]];
};

export const mapVariantToTextColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'textPrimaryDefault',
        secondary: 'textDefaultInverted',
        info: 'textAlertBlue',
        warning: 'textAlertYellow',
        destructive: 'textAlertRed',
        tertiary: 'textSubdued',
    };

    return theme[colorMap[$variant]];
};
export const mapVariantToIconColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: 'iconPrimaryDefault',
        secondary: 'iconDefaultInverted',
        info: 'iconAlertBlue',
        warning: 'iconAlertYellow',
        destructive: 'iconAlertRed',
        tertiary: 'iconSubdued',
    };

    return theme[colorMap[$variant]];
};

export const mapVariantToIcon = ({ $variant }: Pick<MapArgs, '$variant'>): IconType => {
    const iconMap: Record<WarningVariant, IconType> = {
        primary: 'LIGHTBULB',
        secondary: 'INFO',
        info: 'INFO',
        warning: 'WARNING',
        destructive: 'WARNING',
        tertiary: 'INFO',
    };

    return iconMap[$variant];
};
