import { type Borders, type NativeBorders, nativeBorders } from './borders';
import { type BoxShadows, type NativeBoxShadows, nativeBoxShadows } from './boxShadows';
import { type CoinsColors, coinsColors } from './coinsColors';
import { type Colors, type ThemeColorVariant, colorVariants } from './colors';
import { type FontFamilies, type NativeFontFamilies, nativeFontFamilies } from './fontFamilies';
import { type FontWeights, fontWeights } from './fontWeights';
import { type Sizes } from './sizes';
import { type NativeSpacings, type Spacings, nativeSpacings } from './spacings';
import { type NativeTypographyStyles, type TypographyStyles, nativeTypography } from './typography';
import { type ZIndices } from './zIndices';

export interface Theme {
    borders: Borders;
    boxShadows: BoxShadows;
    colors: Colors;
    fontFamilies: FontFamilies;
    sizes: Sizes;
    spacings: Spacings;
    typography: TypographyStyles;
    zIndices: ZIndices;
}

interface PrepareThemeOptions {
    colorVariant: ThemeColorVariant;
}

export interface NativeTheme {
    borders: NativeBorders;
    boxShadows: NativeBoxShadows;
    colors: Colors;
    coinsColors: CoinsColors;
    fontFamilies: NativeFontFamilies;
    spacings: NativeSpacings;
    typography: NativeTypographyStyles;
    fontWeights: FontWeights;
}

export const prepareNativeTheme = ({ colorVariant }: PrepareThemeOptions): NativeTheme => {
    const colors = colorVariants[colorVariant];

    return {
        borders: nativeBorders,
        boxShadows: nativeBoxShadows,
        colors,
        coinsColors,
        fontFamilies: nativeFontFamilies,
        spacings: nativeSpacings,
        typography: nativeTypography,
        fontWeights,
    };
};
