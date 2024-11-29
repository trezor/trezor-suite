import { css, DefaultTheme, RuleSet } from 'styled-components';

import {
    spacingsPx,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    SpacingPxValues,
    CSSColor,
} from '@trezor/theme';

import { PaddingType, FillType, CardVariant } from './types';

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

            ${$isClickable &&
            css`
                &:hover {
                    box-shadow: ${$elevation === 1 && theme.boxShadowElevated};
                }
            `}
        `,
        none: css`
            border: 1px solid ${mapElevationToBorder({ $elevation, theme })};
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
