import { DefaultTheme, RuleSet, css } from 'styled-components';

import { BorderRadii, Color, TypographyStyle } from '@trezor/theme';

import { ButtonIntent, ButtonPriority, ButtonSize, CommonButtonProps, InverseKey } from './types';
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
    normal: 'stateContentDisabled',
    inverse: 'stateContentDisabledInverse',
};

const colorMap: Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>> = {
    normal: {
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
    },
    inverse: {
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
        primary: 'stateFillElementBoldDisabled',
        secondary: 'stateFillElementSoftDisabled',
    },
    inverse: {
        primary: 'stateFillElementBoldInverseDisabled',
        secondary: 'stateFillElementSoftInverseDisabled',
    },
};

const backgroundMapBase: Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>> = {
    normal: {
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
    },
    inverse: {
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
    },
};

const backgroundMapHovered: Record<
    InverseKey,
    Record<ButtonPriority, Record<ButtonIntent, Color>>
> = {
    normal: {
        primary: {
            brand: 'stateFillElementBrandBoldHovered',
            neutral: 'stateFillElementContrastHovered',
            info: 'stateFillElementInfoBoldHovered',
            warning: 'stateFillElementWarningBoldHovered',
            critical: 'stateFillElementNegativeBoldHovered',
            accentViolet: 'stateFillElementAccentVioletBoldHovered',
            accentOrange: 'stateFillElementAccentOrangeBoldHovered',
        },
        secondary: {
            brand: 'stateFillElementBrandSoftHovered',
            neutral: 'stateFillElementNeutralSoftHovered',
            info: 'stateFillElementInfoSoftHovered',
            warning: 'stateFillElementWarningSoftHovered',
            critical: 'stateFillElementNegativeSoftHovered',
            accentViolet: 'stateFillElementAccentVioletSoftHovered',
            accentOrange: 'stateFillElementAccentOrangeSoftHovered',
        },
    },
    inverse: {
        primary: {
            brand: 'stateFillElementBrandBoldInverseHovered',
            neutral: 'stateFillElementNeutralLightHovered',
            info: 'stateFillElementInfoBoldInverseHovered',
            warning: 'stateFillElementWarningBoldInverseHovered',
            critical: 'stateFillElementNegativeBoldInverseHovered',
            accentViolet: 'stateFillElementAccentVioletBoldInverseHovered',
            accentOrange: 'stateFillElementAccentOrangeBoldInverseHovered',
        },
        secondary: {
            brand: 'stateFillElementBrandSoftInverseHovered',
            neutral: 'stateFillElementNeutralSoftInverseHovered',
            info: 'stateFillElementInfoSoftInverseHovered',
            warning: 'stateFillElementWarningSoftInverseHovered',
            critical: 'stateFillElementNegativeSoftInverseHovered',
            accentViolet: 'stateFillElementAccentVioletSoftInverseHovered',
            accentOrange: 'stateFillElementAccentOrangeSoftInverseHovered',
        },
    },
};

const backgroundMapPressed: Record<
    InverseKey,
    Record<ButtonPriority, Record<ButtonIntent, Color>>
> = {
    normal: {
        primary: {
            brand: 'stateFillElementBrandBoldPressed',
            neutral: 'stateFillElementContrastPressed',
            info: 'stateFillElementInfoBoldPressed',
            warning: 'stateFillElementWarningBoldPressed',
            critical: 'stateFillElementNegativeBoldPressed',
            accentViolet: 'stateFillElementAccentVioletBoldPressed',
            accentOrange: 'stateFillElementAccentOrangeBoldPressed',
        },
        secondary: {
            brand: 'stateFillElementBrandSoftPressed',
            neutral: 'stateFillElementNeutralSoftPressed',
            info: 'stateFillElementInfoSoftPressed',
            warning: 'stateFillElementWarningSoftPressed',
            critical: 'stateFillElementNegativeSoftPressed',
            accentViolet: 'stateFillElementAccentVioletSoftPressed',
            accentOrange: 'stateFillElementAccentOrangeSoftPressed',
        },
    },
    inverse: {
        primary: {
            brand: 'stateFillElementBrandBoldInversePressed',
            neutral: 'stateFillElementNeutralLightPressed',
            info: 'stateFillElementInfoBoldInversePressed',
            warning: 'stateFillElementWarningBoldInversePressed',
            critical: 'stateFillElementNegativeBoldInversePressed',
            accentViolet: 'stateFillElementAccentVioletBoldInversePressed',
            accentOrange: 'stateFillElementAccentOrangeBoldInversePressed',
        },
        secondary: {
            brand: 'stateFillElementBrandSoftInversePressed',
            neutral: 'stateFillElementNeutralSoftInversePressed',
            info: 'stateFillElementInfoSoftInversePressed',
            warning: 'stateFillElementWarningSoftInversePressed',
            critical: 'stateFillElementNegativeSoftInversePressed',
            accentViolet: 'stateFillElementAccentVioletSoftInversePressed',
            accentOrange: 'stateFillElementAccentOrangeSoftInversePressed',
        },
    },
};

export const mapPropsToCSS = (
    intent: ButtonIntent,
    priority: ButtonPriority,
    isDisabled: boolean,
    isInverse: boolean,
    theme: DefaultTheme,
): RuleSet<object> => {
    const inverseKey: InverseKey = isInverse ? 'inverse' : 'normal';

    if (isDisabled) {
        return css`
            background: ${theme[backgroundMapDisabled[inverseKey][priority]]};
        `;
    }

    return css`
        background: ${theme[backgroundMapBase[inverseKey][priority][intent]]};

        &:hover {
            background: ${theme[backgroundMapHovered[inverseKey][priority][intent]]};
        }

        &:active {
            background: ${theme[backgroundMapPressed[inverseKey][priority][intent]]};
        }
    `;
};
