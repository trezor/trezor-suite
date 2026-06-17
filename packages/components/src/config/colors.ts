import { colorVariants, mapBoxShadowsToCSS } from '@trezor/theme';

// TODO: button hover color could be derived from its based color
//       by applying something like opacity/darkening, same goes for gradients

type LightThemeProps = typeof intermediaryTheme.light;
type DarkThemeProps = typeof intermediaryTheme.dark;

// Extracts values for common props (eg. NEUE_BG_GREEN: "#00854D" | "#e3ede0")
type CommonThemeProps = {
    [K in keyof LightThemeProps & keyof DarkThemeProps]: LightThemeProps[K] | DarkThemeProps[K];
};

type PropsOnlyInLightTheme = Omit<LightThemeProps, keyof DarkThemeProps>;
type PropsOnlyInDarkTheme = Omit<DarkThemeProps, keyof LightThemeProps>;

/**
 * IMPORTANT:
 *
 * You have to do this in the every package where you are accessing these theme props
 *    1) create `styled.d.ts` file in the root of the project with overwrite of DefaultTheme
 *    2) add `typescript-styled-plugin` into the packages devDependencies
 *
 *  See `suite` package for reference.
 */

// All common theme props and their values are nicely listed,
// props that are specific to given theme are marked optional.
export type SuiteThemeColors = CommonThemeProps &
    Partial<PropsOnlyInDarkTheme> &
    Partial<PropsOnlyInLightTheme>;

export const intermediaryTheme = {
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
