import { type DefaultTheme, type RuleSet, css } from 'styled-components';

import { type Color, type SpacingValuesNew, type TypographyStyle } from '@trezor/theme';

import { type TextButtonSize } from './types';
import { type ButtonIntent, type ButtonPriority, type InverseKey } from '../types';

export const mapSizeToGap = (size: TextButtonSize): SpacingValuesNew => {
    const gapMap: Record<TextButtonSize, SpacingValuesNew> = {
        large: 8,
        small: 6,
    };

    return gapMap[size];
};

export const mapSizeToIconSize = (size: TextButtonSize) => {
    const iconSizeMap = {
        large: 20,
        small: 16,
    } as const;

    return iconSizeMap[size];
};

export const mapSizeToTypographyStyle = (size: TextButtonSize): TypographyStyle => {
    const typographyStyleMap: Record<TextButtonSize, TypographyStyle> = {
        large: 'body-md',
        small: 'body-sm',
    };

    return typographyStyleMap[size];
};

const colorMap: Record<InverseKey, Record<Exclude<ButtonIntent, 'neutral'>, Color>> = {
    normal: {
        brand: 'baseContentBrand',
        info: 'baseContentInfo',
        warning: 'baseContentWarning',
        critical: 'baseContentNegative',
        accentViolet: 'baseContentAccentViolet',
        accentOrange: 'baseContentAccentOrange',
    },
    inverse: {
        brand: 'baseContentBrandInverse',
        info: 'baseContentInfoInverse',
        warning: 'baseContentWarningInverse',
        critical: 'baseContentNegativeInverse',
        accentViolet: 'baseContentAccentVioletInverse',
        accentOrange: 'baseContentAccentOrangeInverse',
    },
};

const neutralColorMap: Record<InverseKey, Record<ButtonPriority, Color>> = {
    normal: {
        primary: 'baseContentPrimary',
        secondary: 'baseContentSecondary',
    },
    inverse: {
        primary: 'baseContentPrimaryInverse',
        secondary: 'baseContentSecondaryInverse',
    },
};

const colorMapHovered: Record<InverseKey, Record<Exclude<ButtonIntent, 'neutral'>, Color>> = {
    normal: {
        brand: 'stateContentBrandHovered',
        info: 'stateContentInfoHovered',
        warning: 'stateContentWarningHovered',
        critical: 'stateContentNegativeHovered',
        accentViolet: 'stateContentAccentVioletHovered',
        accentOrange: 'stateContentAccentOrangeHovered',
    },
    inverse: {
        brand: 'stateContentBrandInverseHovered',
        info: 'stateContentInfoInverseHovered',
        warning: 'stateContentWarningInverseHovered',
        critical: 'stateContentNegativeInverseHovered',
        accentViolet: 'stateContentAccentVioletInverseHovered',
        accentOrange: 'stateContentAccentOrangeInverseHovered',
    },
};

const neutralColorMapHovered: Record<InverseKey, Record<ButtonPriority, Color>> = {
    normal: {
        primary: 'stateContentPrimaryHovered',
        secondary: 'stateContentSecondaryHovered',
    },
    inverse: {
        primary: 'stateContentPrimaryInverseHovered',
        secondary: 'stateContentSecondaryInverseHovered',
    },
};

const colorMapPressed: Record<InverseKey, Record<Exclude<ButtonIntent, 'neutral'>, Color>> = {
    normal: {
        brand: 'stateContentBrandPressed',
        info: 'stateContentInfoPressed',
        warning: 'stateContentWarningPressed',
        critical: 'stateContentNegativePressed',
        accentViolet: 'stateContentAccentVioletPressed',
        accentOrange: 'stateContentAccentOrangePressed',
    },
    inverse: {
        brand: 'stateContentBrandInversePressed',
        info: 'stateContentInfoInversePressed',
        warning: 'stateContentWarningInversePressed',
        critical: 'stateContentNegativeInversePressed',
        accentViolet: 'stateContentAccentVioletInversePressed',
        accentOrange: 'stateContentAccentOrangeInversePressed',
    },
};

const neutralColorMapPressed: Record<InverseKey, Record<ButtonPriority, Color>> = {
    normal: {
        primary: 'stateContentSecondaryPressed',
        secondary: 'stateContentNeutralPressed',
    },
    inverse: {
        primary: 'stateContentSecondaryInversePressed',
        secondary: 'stateContentNeutralInversePressed',
    },
};

export const mapIntentToCSS = (
    intent: ButtonIntent,
    priority: ButtonPriority,
    isInverse: boolean,
    isDisabled: boolean,
    theme: DefaultTheme,
): RuleSet<object> => {
    const inverseKey: InverseKey = isInverse ? 'inverse' : 'normal';
    const isNeutral = intent === 'neutral';

    if (isDisabled) {
        return css`
            color: ${theme.stateContentDisabled};
        `;
    }

    const colorDefault = isNeutral
        ? neutralColorMap[inverseKey][priority]
        : colorMap[inverseKey][intent];
    const colorHovered = isNeutral
        ? neutralColorMapHovered[inverseKey][priority]
        : colorMapHovered[inverseKey][intent];
    const colorPressed = isNeutral
        ? neutralColorMapPressed[inverseKey][priority]
        : colorMapPressed[inverseKey][intent];

    return css`
        color: ${theme[colorDefault]};

        &:hover,
        &:focus {
            color: ${theme[colorHovered]};
        }

        &:active {
            color: ${theme[colorPressed]};
        }
    `;
};
