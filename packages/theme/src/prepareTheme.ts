import { Borders, borders, NativeBorders, nativeBorders } from './borders';
import { BoxShadows, boxShadows, NativeBoxShadows, nativeBoxShadows } from './boxShadows';
import { Colors, colorVariants, ThemeColorVariant } from './colors';
import { FontFamilies, fontFamilies, NativeFontFamilies, nativeFontFamilies } from './fontFamilies';
import { Sizes, sizes } from './sizes';
import { NativeSpacings, nativeSpacings, Spacings, spacings } from './spacings';
import {
    nativeTypography,
    NativeTypographyStyles,
    typography,
    TypographyStyles,
} from './typography';
import { ZIndices, zIndices } from './zIndices';

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

export const prepareTheme = ({ colorVariant }: PrepareThemeOptions): Theme => {
    const colors = colorVariants[colorVariant];
    // TODO shadows will need to change color according to theme

    return {
        borders,
        boxShadows,
        colors,
        fontFamilies,
        sizes,
        spacings,
        typography,
        zIndices,
    };
};

export interface NativeTheme {
    borders: NativeBorders;
    boxShadows: NativeBoxShadows;
    colors: Colors;
    fontFamilies: NativeFontFamilies;
    spacings: NativeSpacings;
    typography: NativeTypographyStyles;
}

export const prepareNativeTheme = ({ colorVariant }: PrepareThemeOptions): NativeTheme => {
    const colors = colorVariants[colorVariant];

    return {
        borders: nativeBorders,
        boxShadows: nativeBoxShadows,
        colors,
        fontFamilies: nativeFontFamilies,
        spacings: nativeSpacings,
        typography: nativeTypography,
    };
};
