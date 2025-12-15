import type { Borders, NativeBorders } from './borders';
import { nativeBorders } from './borders';
import type { BoxShadows, NativeBoxShadows } from './boxShadows';
import { nativeBoxShadows } from './boxShadows';
import type { CoinsColors } from './coinsColors';
import { coinsColors } from './coinsColors';
import type { Colors, ThemeColorVariant } from './colors';
import { colorVariants } from './colors';
import type { FontFamilies, NativeFontFamilies } from './fontFamilies';
import { nativeFontFamilies } from './fontFamilies';
import type { FontWeights } from './fontWeights';
import { fontWeights } from './fontWeights';
import type { Sizes } from './sizes';
import type { NativeSpacings, Spacings } from './spacings';
import { nativeSpacings } from './spacings';
import type { NativeTypographyStyles, TypographyStyles } from './typography';
import { nativeTypography } from './typography';
import type { ZIndices } from './zIndices';

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
