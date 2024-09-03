import { Color, CSSColor, Elevation, mapElevationToBackgroundToken } from '@trezor/theme';
import { BannerVariant } from './types';
import { DefaultTheme } from 'styled-components';
import { IconName } from '../Icon/Icon';

type MapArgs = {
    $variant: BannerVariant;
    theme: DefaultTheme;
    $elevation: Elevation;
};

export const mapVariantToBackgroundColor = ({ $variant, theme, $elevation }: MapArgs): CSSColor => {
    const colorMap: Record<BannerVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
        tertiary: mapElevationToBackgroundToken({ $elevation }),
    };

    return theme[colorMap[$variant]];
};

export const mapVariantToTextColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<BannerVariant, Color> = {
        primary: 'textPrimaryDefault',
        info: 'textAlertBlue',
        warning: 'textAlertYellow',
        destructive: 'textAlertRed',
        tertiary: 'textSubdued',
    };

    return theme[colorMap[$variant]];
};
export const mapVariantToIconColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<BannerVariant, Color> = {
        primary: 'iconPrimaryDefault',
        info: 'iconAlertBlue',
        warning: 'iconAlertYellow',
        destructive: 'iconAlertRed',
        tertiary: 'iconSubdued',
    };

    return theme[colorMap[$variant]];
};

export const mapVariantToIcon = ({ $variant }: Pick<MapArgs, '$variant'>): IconName => {
    const iconMap: Record<BannerVariant, IconName> = {
        primary: 'lightbulb',
        info: 'info',
        warning: 'warningTriangle',
        destructive: 'warningTriangle',
        tertiary: 'info',
    };

    return iconMap[$variant];
};
