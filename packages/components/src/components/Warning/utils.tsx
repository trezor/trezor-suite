import { Color, CSSColor, Elevation, mapElevationToBackgroundToken } from '@trezor/theme';
import { WarningVariant } from './types';
import { IconType } from '../Icon/Icon';
import { DefaultTheme } from 'styled-components';

type MapArgs = {
    $variant: WarningVariant;
    theme: DefaultTheme;
    $elevation: Elevation;
    $isSubtle: boolean;
};

export const mapVariantToBackgroundColor = ({
    $variant,
    theme,
    $elevation,
    $isSubtle,
}: MapArgs): CSSColor => {
    const colorMap: Record<WarningVariant, Color> = {
        primary: $isSubtle ? 'backgroundPrimaryDefault' : 'backgroundPrimarySubtleOnElevation0',
        secondary: 'backgroundNeutralBold', // @TODO delete
        info: $isSubtle ? 'backgroundAlertBlueBold' : 'backgroundAlertBlueSubtleOnElevation0',
        warning: $isSubtle
            ? 'backgroundAlertYellowBold'
            : 'backgroundAlertYellowSubtleOnElevation0',
        destructive: $isSubtle ? 'backgroundAlertRedBold' : 'backgroundAlertRedSubtleOnElevation0',
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
