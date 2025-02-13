import { DefaultTheme, RuleSet, css } from 'styled-components';

import { CSSColor, Elevation, mapElevationToBackground, spacings } from '@trezor/theme';

import { CardVariant, FillType, PaddingType } from './types';
import { Padding } from '../../utils/frameProps';

type PaddingMapArgs = {
    paddingType: PaddingType;
    hasHeading?: boolean;
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

export const mapPaddingTypeToPadding = ({
    paddingType,
    hasHeading,
}: PaddingMapArgs): Padding | undefined => {
    const paddingMap: Record<PaddingType, Padding | undefined> = {
        none: undefined,
        small: hasHeading ? { vertical: spacings.sm, horizontal: spacings.md } : spacings.sm,
        normal: hasHeading ? { vertical: spacings.md, horizontal: spacings.lg } : spacings.lg,
        large: hasHeading ? { vertical: spacings.lg, horizontal: spacings.xl } : spacings.xl,
    };

    return paddingMap[paddingType];
};

export const mapPaddingTypeToLabelPadding = ({ paddingType }: PaddingMapArgs): Padding => {
    const paddingMap: Record<PaddingType, Padding> = {
        none: { vertical: spacings.xxs },
        small: { vertical: spacings.xxs, horizontal: spacings.sm },
        normal: { vertical: spacings.xs, horizontal: spacings.lg },
        large: { vertical: spacings.sm, horizontal: spacings.xl },
    };

    return paddingMap[paddingType];
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
            outline: 1px solid transparent;

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
                      outline: 1px solid ${theme.borderElevation3};
                  `
                : css`
                      background: ${theme.backgroundSurfaceElevationNegative};
                      outline: 1px solid ${theme.borderElevation0};
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
