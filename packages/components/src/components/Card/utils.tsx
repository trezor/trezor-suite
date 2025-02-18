import { DefaultTheme, RuleSet, css } from 'styled-components';

import {
    CSSColor,
    Elevation,
    SpacingPxValues,
    mapElevationToBackground,
    spacingsPx,
} from '@trezor/theme';

import { CardVariant, FillType, PaddingType } from './types';

type PaddingMapArgs = {
    $paddingType: PaddingType;
};

type FillTypeMapArgs = {
    $fillType: FillType;
    $elevation: Elevation;
    $isClickable: boolean;
    $hasLabel: boolean;
    theme: DefaultTheme;
};

type VariantMapArgs = {
    $variant: CardVariant;
    theme: DefaultTheme;
};

export const mapPaddingTypeToLabelPadding = ({ $paddingType }: PaddingMapArgs): string => {
    const paddingMap: Record<PaddingType, string> = {
        none: `${spacingsPx.xxs} 0`,
        small: `${spacingsPx.xxs} ${spacingsPx.sm}`,
        normal: `${spacingsPx.xs} ${spacingsPx.lg}`,
        large: `${spacingsPx.sm} ${spacingsPx.xl}`,
    };

    return paddingMap[$paddingType];
};

export const mapPaddingTypeToPadding = ({ $paddingType }: PaddingMapArgs): SpacingPxValues => {
    const paddingMap: Record<PaddingType, SpacingPxValues> = {
        none: '0px',
        small: spacingsPx.sm,
        normal: spacingsPx.lg,
        large: spacingsPx.xl,
    };

    return paddingMap[$paddingType];
};

export const mapFillTypeToCSS = ({
    $fillType,
    $elevation,
    $isClickable,
    $hasLabel,
    theme,
}: FillTypeMapArgs): RuleSet<object> => {
    const cssMap: Record<FillType, RuleSet<object>> = {
        default: css`
            background: ${mapElevationToBackground({ $elevation, theme })};
            box-shadow: ${$elevation === 1 && !$hasLabel && theme.boxShadowBase};
            border: 1px solid transparent;

            ${$isClickable &&
            css`
                &:hover {
                    box-shadow: ${theme.boxShadowElevated};
                }
            `}
        `,
        flat:
            theme.variant === 'dark'
                ? css`
                      background: none;
                      border: 1px solid ${theme.borderElevation3};
                  `
                : css`
                      background: ${theme.backgroundSurfaceElevationNegative};
                      border: 1px solid ${theme.borderElevation0};
                  `,
    };

    return cssMap[$fillType];
};

export const mapVariantToColor = ({ $variant, theme }: VariantMapArgs): CSSColor => {
    const colorMap: Record<CardVariant, CSSColor> = {
        primary: theme.backgroundSecondaryDefault,
        warning: theme.backgroundAlertYellowBold,
    };

    return colorMap[$variant];
};
