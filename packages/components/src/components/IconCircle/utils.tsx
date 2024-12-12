import { DefaultTheme } from 'styled-components';

import { Color, CSSColor } from '@trezor/theme';

import { IconCircleVariant, IconCirclePaddingType } from './types';

type VariantMapArgs = {
    theme: DefaultTheme;
    $hasBorder: boolean;
    $variant: IconCircleVariant;
};

type PaddingTypeMap = {
    $paddingType: IconCirclePaddingType;
    $size: number;
};

export const mapVariantToIconBorderColor = ({ $variant, theme }: VariantMapArgs): CSSColor => {
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
    $variant,
}: VariantMapArgs): CSSColor => {
    const noBorderColorMap: Record<IconCircleVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
        info: 'backgroundAlertBlueSubtleOnElevation0',
        tertiary: 'backgroundTertiaryDefaultOnElevation0',
    };

    const borderColorMap: Record<IconCircleVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation2',
        warning: 'backgroundAlertYellowSubtleOnElevation2',
        destructive: 'backgroundAlertRedSubtleOnElevation2',
        info: 'backgroundAlertBlueSubtleOnElevation2',
        tertiary: 'backgroundTertiaryDefaultOnElevation1',
    };

    return theme[($hasBorder ? borderColorMap : noBorderColorMap)[$variant]];
};

export const mapPaddingTypeToDimensions = ({ $paddingType }: PaddingTypeMap): string => {
    const dimensionsMap: Record<IconCirclePaddingType, string> = {
        small: '70%',
        medium: '60%',
        large: '50%',
    };

    return dimensionsMap[$paddingType];
};
