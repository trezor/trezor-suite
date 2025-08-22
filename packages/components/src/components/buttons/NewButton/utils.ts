import { DefaultTheme, RuleSet, css } from 'styled-components';

import { BorderRadii, CSSColor, TypographyStyle } from '@trezor/theme';

import { NewButtonIntent, NewButtonPriority, NewButtonSize } from './types';
import { Padding } from '../../../utils/frameProps';

const OPACITY_HOVER_STATE = 0.82;
const OPACITY_ACTIVE_STATE = 0.74;

export const addAlphaToHex = (hex: CSSColor, percent: number): CSSColor => {
    const cleanHex = hex.replace(/^#/, '');
    const clampedPercent = Math.min(1, Math.max(0, percent));

    const normalizedHex =
        cleanHex.length === 3 || cleanHex.length === 4
            ? cleanHex
                  .split('')
                  .map(c => c + c)
                  .join('')
            : cleanHex;

    const rgbHex = normalizedHex.slice(0, 6);
    const existingAlphaHex = normalizedHex.length === 8 ? normalizedHex.slice(6, 8) : 'FF';
    const baseAlpha = parseInt(existingAlphaHex, 16);
    const newAlphaHex = Math.round(baseAlpha * clampedPercent)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();

    return `#${rgbHex}${newAlphaHex}`;
};

export const mapSizeToPadding = (size: NewButtonSize): Padding => {
    const paddingMap: Record<NewButtonSize, Padding> = {
        large: { horizontal: 20, vertical: 10 },
        medium: { horizontal: 16, vertical: 8 },
        small: { horizontal: 10, vertical: 4 },
    };

    return paddingMap[size];
};

export const mapSizeToBorderRadius = (size: NewButtonSize): BorderRadii => {
    const borderRadiusMap: Record<NewButtonSize, BorderRadii> = {
        large: '12px',
        medium: '10px',
        small: '8px',
    };

    return borderRadiusMap[size];
};

export const mapSizeToIconSize = (size: NewButtonSize): number => {
    const iconSizeMap: Record<NewButtonSize, number> = {
        large: 20,
        medium: 16,
        small: 16,
    };

    return iconSizeMap[size];
};

export const mapSizeToTypographyStyle = (size: NewButtonSize): TypographyStyle => {
    const typographyStyleMap: Record<NewButtonSize, TypographyStyle> = {
        large: 'highlight',
        medium: 'callout',
        small: 'callout',
    };

    return typographyStyleMap[size];
};

export const mapPropsToColor = (
    intent: NewButtonIntent,
    priority: NewButtonPriority,
    isDisabled: boolean,
    isInverse: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return isInverse ? theme.stateContentDisabledInverse : theme.stateContentDisabled;
    }

    const colorMap: Record<NewButtonPriority, Record<NewButtonIntent, CSSColor>> = {
        primary: {
            brand: theme.baseContentOnActionBrandPrimary,
            neutral: theme.baseContentReversePrimary,
            info: theme.baseContentOnActionInfoPrimary,
            warning: theme.baseContentOnActionWarningPrimary,
            critical: theme.baseContentOnActionNegativePrimary,
        },
        secondary: {
            brand: theme.baseContentBrandContrast,
            neutral: theme.baseContentNeutralContrast,
            info: theme.baseContentInfoContrast,
            warning: theme.baseContentWarningContrast,
            critical: theme.baseContentNegativeContrast,
        },
    };

    const colorMapInverse: Record<NewButtonPriority, Record<NewButtonIntent, CSSColor>> = {
        primary: {
            brand: theme.baseContentOnActionBrandPrimaryInverse,
            neutral: theme.baseContentReversePrimaryInverse,
            info: theme.baseContentOnActionInfoPrimaryInverse,
            warning: theme.baseContentOnActionWarningPrimaryInverse,
            critical: theme.baseContentOnActionNegativePrimaryInverse,
        },
        secondary: {
            brand: theme.baseContentBrandContrastInverse,
            neutral: theme.baseContentNeutralContrastInverse,
            info: theme.baseContentInfoContrastInverse,
            warning: theme.baseContentWarningContrastInverse,
            critical: theme.baseContentNegativeContrastInverse,
        },
    };

    return isInverse ? colorMapInverse[priority][intent] : colorMap[priority][intent];
};

export const mapPropsToCSS = (
    intent: NewButtonIntent,
    priority: NewButtonPriority,
    isDisabled: boolean,
    isInverse: boolean,
    theme: DefaultTheme,
): RuleSet<object> => {
    if (isDisabled) {
        const backgroundMapDisabled: Record<NewButtonPriority, CSSColor> = {
            primary: theme.stateFillElementBoldDisabled,
            secondary: theme.stateFillElementSoftDisabled,
        };

        const backgroundMapDisabledInverse: Record<NewButtonPriority, CSSColor> = {
            primary: theme.stateFillElementBoldInverseDisabled,
            secondary: theme.stateFillElementSoftInverseDisabled,
        };

        const backgroundColor = isInverse
            ? backgroundMapDisabledInverse[priority]
            : backgroundMapDisabled[priority];

        return css`
            background: ${backgroundColor};
        `;
    }

    const backgroundMap: Record<NewButtonPriority, Record<NewButtonIntent, CSSColor>> = {
        primary: {
            brand: theme.baseFillElementBrandBold,
            neutral: theme.baseFillElementContrast,
            info: theme.baseFillElementInfoBold,
            warning: theme.baseFillElementWarningBold,
            critical: theme.baseFillElementNegativeBold,
        },
        secondary: {
            brand: theme.baseFillElementBrandSoft,
            neutral: theme.baseFillElementNeutralSoft,
            info: theme.baseFillElementInfoSoft,
            warning: theme.baseFillElementWarningSoft,
            critical: theme.baseFillElementNegativeSoft,
        },
    };

    const backgroundMapInverse: Record<NewButtonPriority, Record<NewButtonIntent, CSSColor>> = {
        primary: {
            brand: theme.baseFillElementBrandBoldInverse,
            neutral: theme.baseFillElementNeutralLight,
            info: theme.baseFillElementInfoBoldInverse,
            warning: theme.baseFillElementWarningBoldInverse,
            critical: theme.baseFillElementNegativeBoldInverse,
        },
        secondary: {
            brand: theme.baseFillElementBrandSoftInverse,
            neutral: theme.baseFillElementNeutralSoftInverse,
            info: theme.baseFillElementInfoSoftInverse,
            warning: theme.baseFillElementWarningSoftInverse,
            critical: theme.baseFillElementNegativeSoftInverse,
        },
    };

    const backgroundColor = isInverse
        ? backgroundMapInverse[priority][intent]
        : backgroundMap[priority][intent];

    return css`
        background: ${backgroundColor};

        &:hover {
            background: ${addAlphaToHex(backgroundColor, OPACITY_HOVER_STATE)};
        }

        &:active {
            background: ${addAlphaToHex(backgroundColor, OPACITY_ACTIVE_STATE)};
        }
    `;
};
