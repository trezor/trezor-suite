import { boxShadows, colorVariants } from '@trezor/theme';

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

/** @deprecated Do NOT export it! Use intermediaryTheme instead! */
const THEME = {
    light: {
        legacy: {
            THEME: 'light',

            BG_GREY: '#f4f4f4',
            BG_TOOLTIP: '#212223',

            TYPE_LIGHTER_GREY: '#bdbdbd',

            GRADIENT_SLIDER_GREEN_START: '#2A9649',
            GRADIENT_SLIDER_GREEN_END: '#95CDA5',
            GRADIENT_SLIDER_YELLOW_START: '#C8B883',
            GRADIENT_SLIDER_YELLOW_END: '#C8B882',
            GRADIENT_SLIDER_RED_END: '#BF6767',

            IMAGE_FILTER: 'none',

            HOVER_DARKEN_FILTER: 0.06,
            HOVER_TRANSITION_TIME: '150ms',
            HOVER_TRANSITION_EFFECT: 'ease-out',
        },
    },
    dark: {
        legacy: {
            THEME: 'dark',

            BG_GREY: '#18191a',
            BG_TOOLTIP: '#3a3b3c', // same as STROKE_GREY in dark theme

            TYPE_LIGHTER_GREY: '#bdbdbd',

            GRADIENT_SLIDER_GREEN_START: '#2A9649',
            GRADIENT_SLIDER_GREEN_END: '#95CDA5',
            GRADIENT_SLIDER_YELLOW_START: '#C8B883',
            GRADIENT_SLIDER_YELLOW_END: '#C8B882',
            GRADIENT_SLIDER_RED_END: '#BF6767',

            IMAGE_FILTER: 'brightness(0.8) contrast(1.2) saturate(1.2)',

            HOVER_DARKEN_FILTER: -0.04,
            HOVER_TRANSITION_TIME: '150ms',
            HOVER_TRANSITION_EFFECT: 'ease-out',
        },
    },
} as const;

export const intermediaryTheme = {
    light: {
        ...THEME.light,
        ...colorVariants.standard,
        ...boxShadows.standard,
    },
    dark: {
        ...THEME.dark,
        ...colorVariants.dark,
        ...boxShadows.dark,
    },
    debug: {
        ...THEME.light,
        ...colorVariants.debug,
        ...boxShadows.standard,
    },
};
