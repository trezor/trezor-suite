import { Color, CSSColor } from '@trezor/theme';
import { NewModalVariant, NewModalSize, NewModalAlignment } from './types';
import { DefaultTheme } from 'styled-components';
import { UIVerticalAlignment, UIHorizontalAlignment } from '../../config/types';
import { TransientProps } from '../../utils/transientProps';
import { NewModalIconExclusiveColorOrVariant } from './NewModalIcon';

type MapArgs = {
    theme: DefaultTheme;
} & TransientProps<NewModalIconExclusiveColorOrVariant>;

export const mapVariantToIconBackground = ({ $variant, theme, $iconColor }: MapArgs): CSSColor => {
    if ($variant === undefined) {
        return $iconColor?.background ?? 'transparent';
    }

    const colorMap: Record<NewModalVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation2',
        warning: 'backgroundAlertYellowSubtleOnElevation2',
        destructive: 'backgroundAlertRedSubtleOnElevation2',
    };

    return theme[colorMap[$variant]];
};

export const mapVariantToIconBorderColor = ({ $variant, theme, $iconColor }: MapArgs): CSSColor => {
    if ($variant === undefined) {
        return $iconColor?.foreground ?? 'transparent';
    }

    const colorMap: Record<NewModalVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        warning: 'backgroundAlertYellowSubtleOnElevation0',
        destructive: 'backgroundAlertRedSubtleOnElevation0',
    };

    return theme[colorMap[$variant]];
};

export const mapModalSizeToWidth = (size: NewModalSize) => {
    const widthMap: Record<NewModalSize, number> = {
        tiny: 400,
        small: 600,
        medium: 680,
        large: 760,
    };

    return widthMap[size];
};

export const mapAlignmentToJustifyContent = (alignment: NewModalAlignment) => {
    const alignmentMap: Record<UIVerticalAlignment, string> = {
        center: 'center',
        top: 'flex-start',
        bottom: 'flex-end',
    };

    return alignmentMap[alignment.y];
};

export const mapAlignmentToAlignItems = (alignment: NewModalAlignment) => {
    const alignmentMap: Record<UIHorizontalAlignment, string> = {
        center: 'center',
        left: 'flex-start',
        right: 'flex-end',
    };

    return alignmentMap[alignment.x];
};
