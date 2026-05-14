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
        brand: 'contentBrand',
        info: 'contentInfo',
        warning: 'contentWarning',
        critical: 'contentCritical',
        accentViolet: 'contentAccentViolet',
    },
    inverse: {
        brand: 'contentOnDarkBrand',
        info: 'contentOnDarkInfo',
        warning: 'contentOnDarkWarning',
        critical: 'contentOnDarkCritical',
        accentViolet: 'contentOnDarkAccentViolet',
    },
};

const neutralColorMap: Record<InverseKey, Record<ButtonPriority, Color>> = {
    normal: {
        primary: 'contentPrimary',
        secondary: 'contentSecondary',
    },
    inverse: {
        primary: 'contentOnDarkPrimary',
        secondary: 'contentOnDarkSecondary',
    },
};

const colorMapHovered: Record<InverseKey, Record<Exclude<ButtonIntent, 'neutral'>, Color>> = {
    normal: {
        brand: 'contentBrandHovered',
        info: 'contentInfoHovered',
        warning: 'contentWarningHovered',
        critical: 'contentCriticalHovered',
        accentViolet: 'contentAccentVioletHovered',
    },
    inverse: {
        brand: 'contentOnDarkBrandHovered',
        info: 'contentOnDarkInfoHovered',
        warning: 'contentOnDarkWarningHovered',
        critical: 'contentOnDarkCriticalHovered',
        accentViolet: 'contentOnDarkAccentVioletHovered',
    },
};

const neutralColorMapHovered: Record<InverseKey, Record<ButtonPriority, Color>> = {
    normal: {
        primary: 'contentPrimaryHovered',
        secondary: 'contentSecondaryHovered',
    },
    inverse: {
        primary: 'contentOnDarkPrimaryHovered',
        secondary: 'contentOnDarkSecondaryHovered',
    },
};

const colorMapPressed: Record<InverseKey, Record<Exclude<ButtonIntent, 'neutral'>, Color>> = {
    normal: {
        brand: 'contentBrandPressed',
        info: 'contentInfoPressed',
        warning: 'contentWarningPressed',
        critical: 'contentCriticalPressed',
        accentViolet: 'contentAccentVioletPressed',
    },
    inverse: {
        brand: 'contentOnDarkBrandPressed',
        info: 'contentOnDarkInfoPressed',
        warning: 'contentOnDarkWarningPressed',
        critical: 'contentOnDarkCriticalPressed',
        accentViolet: 'contentOnDarkAccentVioletPressed',
    },
};

const neutralColorMapPressed: Record<InverseKey, Record<ButtonPriority, Color>> = {
    normal: {
        primary: 'contentSecondaryPressed',
        secondary: 'contentNeutralPressed',
    },
    inverse: {
        primary: 'contentOnDarkSecondaryPressed',
        secondary: 'contentOnDarkNeutralPressed',
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
            color: ${theme.contentDisabled};
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
