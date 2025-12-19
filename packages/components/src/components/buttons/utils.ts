import { DefaultTheme, RuleSet, css } from 'styled-components';

import { BorderRadii, CSSColor, Color, TypographyStyle } from '@trezor/theme';

import { ButtonIntent, ButtonPriority, ButtonSize, CommonButtonProps } from './types';

const OPACITY_HOVER_STATE = 0.82;
const OPACITY_ACTIVE_STATE = 0.74;

export const pickButtonProps = ({
    href,
    target = '_blank',
    onClick,
    type = 'button',
    tabIndex,
    isLoading = false,
    isDisabled = false,
}: CommonButtonProps) => {
    const isLink = href !== undefined;

    return {
        as: isLink ? 'a' : 'button',
        disabled: isLink ? false : isDisabled || isLoading,
        onClick,
        type: isLink ? undefined : type,
        tabIndex,
        href,
        target: isLink ? target : undefined,
        rel: isLink ? 'noreferrer noopener' : undefined,
    };
};

export const commonButtonStyles = css`
    border: 0;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    width: fit-content;
    overflow: hidden;
    -webkit-app-region: no-drag;
    transition: 0.1s ease-in-out;

    &:focus-visible {
        outline: 4px solid ${({ theme }) => theme.stateBorderElementFocused};
        outline-offset: 2px;
    }

    &:disabled {
        cursor: not-allowed;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }
`;

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

export const mapSizeToBorderRadius = (size: ButtonSize): BorderRadii => {
    const borderRadiusMap: Record<ButtonSize, BorderRadii> = {
        large: '12px',
        medium: '10px',
        small: '8px',
    };

    return borderRadiusMap[size];
};

export const mapSizeToIconSize = (size: ButtonSize): number => {
    const iconSizeMap: Record<ButtonSize, number> = {
        large: 20,
        medium: 16,
        small: 16,
    };

    return iconSizeMap[size];
};

export const mapSizeToTypographyStyle = (size: ButtonSize): TypographyStyle => {
    const typographyStyleMap: Record<ButtonSize, TypographyStyle> = {
        large: 'highlight',
        medium: 'callout',
        small: 'callout',
    };

    return typographyStyleMap[size];
};

export const mapPropsToColor = (
    intent: ButtonIntent,
    priority: ButtonPriority,
    isDisabled: boolean,
    isInverse: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme[isInverse ? 'stateContentDisabledInverse' : 'stateContentDisabled'];
    }

    const colorMap: Record<ButtonPriority, Record<ButtonIntent, Color>> = {
        primary: {
            brand: 'baseContentOnActionBrandPrimary',
            neutral: 'baseContentReversePrimary',
            info: 'baseContentOnActionInfoPrimary',
            warning: 'baseContentOnActionWarningPrimary',
            critical: 'baseContentOnActionNegativePrimary',
            accentViolet: 'baseContentOnActionAccentVioletPrimary',
            accentOrange: 'baseContentOnActionAccentOrangePrimary',
        },
        secondary: {
            brand: 'baseContentBrandContrast',
            neutral: 'baseContentNeutralContrast',
            info: 'baseContentInfoContrast',
            warning: 'baseContentWarningContrast',
            critical: 'baseContentNegativeContrast',
            accentViolet: 'baseContentAccentVioletContrast',
            accentOrange: 'baseContentAccentOrangeContrast',
        },
    };

    const colorMapInverse: Record<ButtonPriority, Record<ButtonIntent, Color>> = {
        primary: {
            brand: 'baseContentOnActionBrandPrimaryInverse',
            neutral: 'baseContentReversePrimaryInverse',
            info: 'baseContentOnActionInfoPrimaryInverse',
            warning: 'baseContentOnActionWarningPrimaryInverse',
            critical: 'baseContentOnActionNegativePrimaryInverse',
            accentViolet: 'baseContentOnActionAccentVioletPrimaryInverse',
            accentOrange: 'baseContentOnActionAccentOrangePrimaryInverse',
        },
        secondary: {
            brand: 'baseContentBrandContrastInverse',
            neutral: 'baseContentNeutralContrastInverse',
            info: 'baseContentInfoContrastInverse',
            warning: 'baseContentWarningContrastInverse',
            critical: 'baseContentNegativeContrastInverse',
            accentViolet: 'baseContentAccentVioletContrastInverse',
            accentOrange: 'baseContentAccentOrangeContrastInverse',
        },
    };

    return theme[isInverse ? colorMapInverse[priority][intent] : colorMap[priority][intent]];
};

export const mapPropsToCSS = (
    intent: ButtonIntent,
    priority: ButtonPriority,
    isDisabled: boolean,
    isInverse: boolean,
    theme: DefaultTheme,
): RuleSet<object> => {
    if (isDisabled) {
        const backgroundMapDisabled: Record<ButtonPriority, Color> = {
            primary: 'stateFillElementBoldDisabled',
            secondary: 'stateFillElementSoftDisabled',
        };

        const backgroundMapDisabledInverse: Record<ButtonPriority, Color> = {
            primary: 'stateFillElementBoldInverseDisabled',
            secondary: 'stateFillElementSoftInverseDisabled',
        };

        const backgroundColor =
            theme[
                isInverse ? backgroundMapDisabledInverse[priority] : backgroundMapDisabled[priority]
            ];

        return css`
            background: ${backgroundColor};
        `;
    }

    const backgroundMap: Record<ButtonPriority, Record<ButtonIntent, Color>> = {
        primary: {
            brand: 'baseFillElementBrandBold',
            neutral: 'baseFillElementContrast',
            info: 'baseFillElementInfoBold',
            warning: 'baseFillElementWarningBold',
            critical: 'baseFillElementNegativeBold',
            accentViolet: 'baseFillElementAccentVioletBold',
            accentOrange: 'baseFillElementAccentOrangeBold',
        },
        secondary: {
            brand: 'baseFillElementBrandSoft',
            neutral: 'baseFillElementNeutralSoft',
            info: 'baseFillElementInfoSoft',
            warning: 'baseFillElementWarningSoft',
            critical: 'baseFillElementNegativeSoft',
            accentViolet: 'baseFillElementAccentVioletSoft',
            accentOrange: 'baseFillElementAccentOrangeSoft',
        },
    };

    const backgroundMapInverse: Record<ButtonPriority, Record<ButtonIntent, Color>> = {
        primary: {
            brand: 'baseFillElementBrandBoldInverse',
            neutral: 'baseFillElementNeutralLight',
            info: 'baseFillElementInfoBoldInverse',
            warning: 'baseFillElementWarningBoldInverse',
            critical: 'baseFillElementNegativeBoldInverse',
            accentViolet: 'baseFillElementAccentVioletBoldInverse',
            accentOrange: 'baseFillElementAccentOrangeBoldInverse',
        },
        secondary: {
            brand: 'baseFillElementBrandSoftInverse',
            neutral: 'baseFillElementNeutralSoftInverse',
            info: 'baseFillElementInfoSoftInverse',
            warning: 'baseFillElementWarningSoftInverse',
            critical: 'baseFillElementNegativeSoftInverse',
            accentViolet: 'baseFillElementAccentVioletSoftInverse',
            accentOrange: 'baseFillElementAccentOrangeSoftInverse',
        },
    };

    const backgroundColor =
        theme[isInverse ? backgroundMapInverse[priority][intent] : backgroundMap[priority][intent]];

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
