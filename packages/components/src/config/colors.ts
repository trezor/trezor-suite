import { type BoxShadows, type Colors, colorVariants, mapBoxShadowsToCSS } from '@trezor/theme';

/**
 * IMPORTANT:
 *
 * You have to do this in the every package where you are accessing these theme props
 *    1) create `styled.d.ts` file in the root of the project with overwrite of DefaultTheme
 *    2) add `typescript-styled-plugin` into the packages devDependencies
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
