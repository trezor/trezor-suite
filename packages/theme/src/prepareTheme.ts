import { Borders, NativeBorders, nativeBorders } from './borders';
import { BoxShadows, NativeBoxShadows, nativeBoxShadows } from './boxShadows';
import { Colors, colorVariants, ThemeColorVariant } from './colors';
import { CoinsColors, coinsColors } from './coinsColors';
import { FontFamilies, NativeFontFamilies, nativeFontFamilies } from './fontFamilies';
import { fontWeights, FontWeights } from './fontWeights';
import { Sizes } from './sizes';
import { NativeSpacings, nativeSpacings, Spacings } from './spacings';
import { nativeTypography, NativeTypographyStyles, TypographyStyles } from './typography';
import { ZIndices } from './zIndices';

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
