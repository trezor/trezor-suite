import { DefaultTheme, RuleSet, css } from 'styled-components';

import { Color, TypographyStyle } from '@trezor/theme';

import { TextButtonSize } from './types';
import { ButtonIntent } from '../types';

export const mapSizeToIconSize = (size: TextButtonSize): number => {
    const iconSizeMap: Record<TextButtonSize, number> = {
        large: 24,
        small: 16,
    };

    return iconSizeMap[size];
};

export const mapSizeToTypographyStyle = (size: TextButtonSize): TypographyStyle => {
    const typographyStyleMap: Record<TextButtonSize, TypographyStyle> = {
        large: 'body',
        small: 'hint',
    };

    return typographyStyleMap[size];
};

export const mapIntentToCSS = (
    intent: ButtonIntent,
    isDisabled: boolean,
    theme: DefaultTheme,
): RuleSet<object> => {
    const mapIntentToColor: Record<ButtonIntent, Color> = {
        brand: 'baseContentBrand',
        neutral: 'baseContentSecondary',
        info: 'baseContentInfo',
        warning: 'baseContentWarning',
        critical: 'baseContentNegative',
        accentViolet: 'baseContentAccentViolet',
        accentOrange: 'baseContentAccentOrange',
    };

    const mapIntentToHoverColor: Record<ButtonIntent, Color> = {
        brand: 'stateContentBrandHovered',
        neutral: 'stateContentSecondaryHovered',
        info: 'stateContentInfoHovered',
        warning: 'stateContentWarningHovered',
        critical: 'stateContentNegativeHovered',
        accentViolet: 'stateContentAccentVioletHovered',
        accentOrange: 'stateContentAccentOrangeHovered',
    };

    const mapIntentToActiveColor: Record<ButtonIntent, Color> = {
        brand: 'stateContentBrandPressed',
        neutral: 'stateContentSecondaryPressed',
        info: 'stateContentInfoPressed',
        warning: 'stateContentWarningPressed',
        critical: 'stateContentNegativePressed',
        accentViolet: 'stateContentAccentVioletPressed',
        accentOrange: 'stateContentAccentOrangePressed',
    };

    return isDisabled
        ? css`
              color: ${theme.stateContentDisabled};
          `
        : css`
              color: ${theme[mapIntentToColor[intent]]};

              &:hover,
              &:focus {
                  color: ${theme[mapIntentToHoverColor[intent]]};
              }

              &:active {
                  color: ${theme[mapIntentToActiveColor[intent]]};
              }
          `;
};
