import { Color, CSSColor } from '@trezor/theme';
import { IconCircleVariant, IconCircleExclusiveColorOrVariant } from './types';
import { DefaultTheme } from 'styled-components';
import { TransientProps } from '../../utils/transientProps';

type MapArgs = {
    theme: DefaultTheme;
    $hasBorder: boolean;
} & TransientProps<IconCircleExclusiveColorOrVariant>;

export const mapVariantToIconBorderColor = ({ $variant, theme, $iconColor }: MapArgs): CSSColor => {
    if ($variant === undefined) {
        return $iconColor?.foreground ?? 'transparent';
    }

    const colorMap: Record<IconCircleVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        tertiary: 'backgroundTertiaryDefaultOnElevation0',
    };

    return theme[colorMap[$variant]];
};

export const mapVariantToIconBackground = ({
    theme,
    $hasBorder,
    $iconColor,
    $variant,
}: MapArgs): CSSColor => {
    if ($variant === undefined) {
        return $iconColor?.background ?? 'transparent';
    }

    const colorMap: Record<number, Record<IconCircleVariant, Color>> = {
        0: {
            primary: 'backgroundPrimarySubtleOnElevation1',
            warning: 'backgroundAlertYellowSubtleOnElevation1',
            destructive: 'backgroundAlertRedSubtleOnElevation1',
            info: 'backgroundAlertBlueSubtleOnElevation1',
            tertiary: 'backgroundTertiaryDefaultOnElevation1',
        },
        1: {
            primary: 'backgroundPrimarySubtleOnElevation2',
            warning: 'backgroundAlertYellowSubtleOnElevation2',
            destructive: 'backgroundAlertRedSubtleOnElevation2',
            info: 'backgroundAlertBlueSubtleOnElevation2',
            tertiary: 'backgroundTertiaryDefaultOnElevation1',
        },
    };

    return theme[colorMap[Number($hasBorder)][$variant]];
};
