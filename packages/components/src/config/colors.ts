import { type BoxShadows, type Colors, colorVariants, mapBoxShadowsToCSS } from '@trezor/theme';

// TODO: button hover color could be derived from its based color
//       by applying something like opacity/darkening, same goes for gradients

/**
 * IMPORTANT:
 *
 * Create a `styled.d.ts` file that overrides `DefaultTheme` in every package that accesses
 * these theme props.
 *
 *  See `suite` package for reference.
 */

type ThemeMode = 'light' | 'dark';

export type SuiteThemeColors = Colors & BoxShadows & { mode: ThemeMode };

type IntermediaryTheme = {
    [Mode in ThemeMode]: SuiteThemeColors & { mode: Mode };
};

export const intermediaryTheme: IntermediaryTheme = {
    light: {
        mode: 'light' as const,
        ...colorVariants.standard,
        ...mapBoxShadowsToCSS(colorVariants.standard),
    },
    dark: {
        mode: 'dark' as const,
        ...colorVariants.dark,
        ...mapBoxShadowsToCSS(colorVariants.dark),
    },
};
