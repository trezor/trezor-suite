import { Borders, NativeBorders, nativeBorders } from './borders';
import { BoxShadows, NativeBoxShadows, nativeBoxShadows } from './boxShadows';
import { CoinsColors, coinsColors } from './coinsColors';
import { Colors, ThemeColorVariant, colorVariants } from './colors';
import { FontFamilies, NativeFontFamilies, nativeFontFamilies } from './fontFamilies';
import { FontWeights, fontWeights } from './fontWeights';
import { Sizes } from './sizes';
import { NativeSpacings, Spacings, nativeSpacings } from './spacings';
import { NativeTypographyStyles, TypographyStyles, nativeTypography } from './typography';
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
