import { type DefaultTheme, type RuleSet, css } from 'styled-components';

import { type BorderRadii, type Color, type TypographyStyle } from '@trezor/theme';

import {
    type ButtonIntent,
    type ButtonPriority,
    type ButtonSize,
    type CommonButtonProps,
    type InverseKey,
} from './types';
import { commonFocusStyles } from '../../utils/utils';

export const pickButtonProps = ({
    href,
    target = '_blank',
    onClick,
    type = 'button',
    tabIndex,
    isLoading = false,
    isDisabled = false,
    isInverse = false,
    intent = 'brand',
    priority = 'primary',
}: CommonButtonProps) => {
    const isLink = href !== undefined;
    const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
        event.currentTarget?.setPointerCapture?.(event.pointerId);
    };

    return {
        as: isLink ? 'a' : 'button',
        disabled: isLink ? false : isDisabled || isLoading,
        onPointerDown: handlePointerDown,
        onClick,
        type: isLink ? undefined : type,
        tabIndex,
        href,
        target: isLink ? target : undefined,
        rel: isLink ? 'noreferrer noopener' : undefined,
        intent,
        isInverse,
        priority,
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
        ${commonFocusStyles}
    }

    &:disabled {
        cursor: not-allowed;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }
`;

export const mapSizeToBorderRadius = (size: ButtonSize): BorderRadii => {
    const borderRadiusMap: Record<ButtonSize, BorderRadii> = {
        large: '12px',
        medium: '10px',
        small: '8px',
    };

    return borderRadiusMap[size];
};

export const mapSizeToIconSize = (size: ButtonSize) => {
    const iconSizeMap = {
        large: 20,
        medium: 16,
        small: 16,
    } as const;

    return iconSizeMap[size];
};

export const mapSizeToTypographyStyle = (size: ButtonSize): TypographyStyle => {
    const typographyStyleMap: Record<ButtonSize, TypographyStyle> = {
        large: 'body-md-strong',
        medium: 'body-sm-strong',
        small: 'body-sm-strong',
    };

    return typographyStyleMap[size];
};

const colorMapDisabled: Record<InverseKey, Color> = {
    normal: 'contentDisabled',
    inverse: 'contentOnDarkDisabled',
};

const colorMap: Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>> = {
    normal: {
        primary: {
            brand: 'contentButtonBrandPrimary',
            neutral: 'contentPrimaryInverse',
            info: 'contentButtonInfoPrimary',
            warning: 'contentButtonWarningPrimary',
            critical: 'contentButtonCriticalPrimary',
            accentViolet: 'contentButtonAccentVioletPrimary',
        },
        secondary: {
            brand: 'contentBrand',
            neutral: 'contentNeutral',
            info: 'contentInfo',
            warning: 'contentWarning',
            critical: 'contentCritical',
            accentViolet: 'contentAccentViolet',
        },
    },
    inverse: {
        primary: {
            brand: 'contentOnDarkButtonBrandPrimary',
            neutral: 'contentOnDarkPrimaryInverse',
            info: 'contentOnDarkButtonInfoPrimary',
            warning: 'contentOnDarkButtonWarningPrimary',
            critical: 'contentOnDarkButtonCriticalPrimary',
            accentViolet: 'contentOnDarkButtonAccentVioletPrimary',
        },
        secondary: {
            brand: 'contentOnDarkBrand',
            neutral: 'contentOnDarkNeutral',
            info: 'contentOnDarkInfo',
            warning: 'contentOnDarkWarning',
            critical: 'contentOnDarkCritical',
            accentViolet: 'contentOnDarkAccentViolet',
        },
    },
};

export const mapPropsToColorToken = (
    intent: ButtonIntent,
    priority: ButtonPriority,
    isDisabled: boolean,
    isInverse: boolean,
): Color => {
    const inverseKey: InverseKey = isInverse ? 'inverse' : 'normal';

    if (isDisabled) {
        return colorMapDisabled[inverseKey];
    }

    return colorMap[inverseKey][priority][intent];
};

const backgroundMapDisabled: Record<InverseKey, Record<ButtonPriority, Color>> = {
    normal: {
        primary: 'elementFillBoldDisabled',
        secondary: 'elementFillSoftDisabled',
    },
    inverse: {
        primary: 'elementFillOnDarkBoldDisabled',
        secondary: 'elementFillOnDarkSoftDisabled',
    },
};

const backgroundMapBase: Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>> = {
    normal: {
        primary: {
            brand: 'elementFillBrandBold',
            neutral: 'elementFillContrast',
            info: 'elementFillInfoBold',
            warning: 'elementFillWarningBold',
            critical: 'elementFillCriticalBold',
            accentViolet: 'elementFillAccentVioletBold',
        },
        secondary: {
            brand: 'elementFillBrandSoft',
            neutral: 'elementFillNeutralSoft',
            info: 'elementFillInfoSoft',
            warning: 'elementFillWarningSoft',
            critical: 'elementFillCriticalSoft',
            accentViolet: 'elementFillAccentVioletSoft',
        },
    },
    inverse: {
        primary: {
            brand: 'elementFillOnDarkBrandBold',
            neutral: 'elementFillOnDarkContrast',
            info: 'elementFillOnDarkInfoBold',
            warning: 'elementFillOnDarkWarningBold',
            critical: 'elementFillOnDarkCriticalBold',
            accentViolet: 'elementFillOnDarkAccentVioletBold',
        },
        secondary: {
            brand: 'elementFillOnDarkBrandSoft',
            neutral: 'elementFillOnDarkNeutralSoft',
            info: 'elementFillOnDarkInfoSoft',
            warning: 'elementFillOnDarkWarningSoft',
            critical: 'elementFillOnDarkCriticalSoft',
            accentViolet: 'elementFillOnDarkAccentVioletSoft',
        },
    },
};

const backgroundMapHovered: Record<
    InverseKey,
    Record<ButtonPriority, Record<ButtonIntent, Color>>
> = {
    normal: {
        primary: {
            brand: 'elementFillBrandBoldHovered',
            neutral: 'elementFillContrastHovered',
            info: 'elementFillInfoBoldHovered',
            warning: 'elementFillWarningBoldHovered',
            critical: 'elementFillCriticalBoldHovered',
            accentViolet: 'elementFillAccentVioletBoldHovered',
        },
        secondary: {
            brand: 'elementFillBrandSoftHovered',
            neutral: 'elementFillNeutralSoftHovered',
            info: 'elementFillInfoSoftHovered',
            warning: 'elementFillWarningSoftHovered',
            critical: 'elementFillCriticalSoftHovered',
            accentViolet: 'elementFillAccentVioletSoftHovered',
        },
    },
    inverse: {
        primary: {
            brand: 'elementFillOnDarkBrandBoldHovered',
            neutral: 'elementFillOnDarkContrastHovered',
            info: 'elementFillOnDarkInfoBoldHovered',
            warning: 'elementFillOnDarkWarningBoldHovered',
            critical: 'elementFillOnDarkCriticalBoldHovered',
            accentViolet: 'elementFillOnDarkAccentVioletBoldHovered',
        },
        secondary: {
            brand: 'elementFillOnDarkBrandSoftHovered',
            neutral: 'elementFillOnDarkNeutralSoftHovered',
            info: 'elementFillOnDarkInfoSoftHovered',
            warning: 'elementFillOnDarkWarningSoftHovered',
            critical: 'elementFillOnDarkCriticalSoftHovered',
            accentViolet: 'elementFillOnDarkAccentVioletSoftHovered',
        },
    },
};

const backgroundMapPressed: Record<
    InverseKey,
    Record<ButtonPriority, Record<ButtonIntent, Color>>
> = {
    normal: {
        primary: {
            brand: 'elementFillBrandBoldPressed',
            neutral: 'elementFillContrastPressed',
            info: 'elementFillInfoBoldPressed',
            warning: 'elementFillWarningBoldPressed',
            critical: 'elementFillCriticalBoldPressed',
            accentViolet: 'elementFillAccentVioletBoldPressed',
        },
        secondary: {
            brand: 'elementFillBrandSoftPressed',
            neutral: 'elementFillNeutralSoftPressed',
            info: 'elementFillInfoSoftPressed',
            warning: 'elementFillWarningSoftPressed',
            critical: 'elementFillCriticalSoftPressed',
            accentViolet: 'elementFillAccentVioletSoftPressed',
        },
    },
    inverse: {
        primary: {
            brand: 'elementFillOnDarkBrandBoldPressed',
            neutral: 'elementFillOnDarkContrastPressed',
            info: 'elementFillOnDarkInfoBoldPressed',
            warning: 'elementFillOnDarkWarningBoldPressed',
            critical: 'elementFillOnDarkCriticalBoldPressed',
            accentViolet: 'elementFillOnDarkAccentVioletBoldPressed',
        },
        secondary: {
            brand: 'elementFillOnDarkBrandSoftPressed',
            neutral: 'elementFillOnDarkNeutralSoftPressed',
            info: 'elementFillOnDarkInfoSoftPressed',
            warning: 'elementFillOnDarkWarningSoftPressed',
            critical: 'elementFillOnDarkCriticalSoftPressed',
            accentViolet: 'elementFillOnDarkAccentVioletSoftPressed',
        },
    },
};

export const mapPropsToCSS = (
    intent: ButtonIntent,
    priority: ButtonPriority,
    isDisabled: boolean,
    isInverse: boolean,
    theme: DefaultTheme,
    isFloating: boolean,
): RuleSet<object> => {
    const inverseKey: InverseKey = isInverse ? 'inverse' : 'normal';
    const getBackground = (backgroundColor: Color) =>
        isFloating
            ? css`
                  background:
                      linear-gradient(${theme[backgroundColor]}, ${theme[backgroundColor]}),
                      ${theme['surfaceFillRaised']};
              `
            : css`
                  background: ${theme[backgroundColor]};
              `;

    if (isDisabled) {
        return css`
            ${getBackground(backgroundMapDisabled[inverseKey][priority])}
        `;
    }

    return css`
        ${getBackground(backgroundMapBase[inverseKey][priority][intent])}

        &:hover {
            ${getBackground(backgroundMapHovered[inverseKey][priority][intent])}
        }

        &:active {
            ${getBackground(backgroundMapPressed[inverseKey][priority][intent])}
        }
    `;
};
