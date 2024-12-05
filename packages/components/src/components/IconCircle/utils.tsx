import { DefaultTheme } from 'styled-components';

import { Color, CSSColor } from '@trezor/theme';

import {
    IconCircleVariant,
    IconCircleExclusiveColorOrVariant,
    IconCirclePaddingType,
} from './types';
import { TransientProps } from '../../utils/transientProps';

type VariantMapArgs = {
    theme: DefaultTheme;
    $hasBorder: boolean;
} & TransientProps<IconCircleExclusiveColorOrVariant>;

type PaddingTypeMap = {
    $paddingType: IconCirclePaddingType;
    $size: number;
};

export const mapVariantToIconBorderColor = ({
    $variant,
    theme,
    $iconColor,
}: VariantMapArgs): CSSColor => {
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
}: VariantMapArgs): CSSColor => {
    if ($variant === undefined) {
        return $iconColor?.background ?? 'transparent';
    }

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
