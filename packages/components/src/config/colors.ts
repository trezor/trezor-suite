// TODO: button hover color could be derived from its based color by applying something like opacity/darkening
// same goes for gradients

import { colorVariants } from '@trezor/theme';

export const THEME = {
    light: {
        THEME: 'light',

        BG_GREEN: '#00854D',
        BG_LIGHT_GREEN: '#effaec',
        BG_SECONDARY: '#effaec', // used for secondary button, in light mode same as LIGHT_GREEN
        BG_SECONDARY_HOVER: '#e3ede0',
        BG_GREEN_HOVER: '#007837',
        BG_LIGHT_GREEN_HOVER: '#e3ede0',
        BG_GREY: '#f4f4f4',
        BG_GREY_OPEN: '#f4f4f4', // used for main menu open state and similar
        BG_GREY_ALT: '#f4f4f4',
        BG_LIGHT_GREY: '#fcfcfc',
        BG_WHITE: '#ffffff',
        BG_WHITE_ALT: '#ffffff', // used for dropdown menus
        BG_WHITE_ALT_HOVER: '#f4f4f4', // used for dropdown menus
        BG_RED: '#d04949',
        BG_LIGHT_RED: '#FEF3F3',
        BG_TOOLTIP: '#212223',
        BG_TOOLTIP_BORDER: '#3a3b3c',
        BG_ICON: 'transparent',

        TYPE_GREEN: '#00854D',
        TYPE_ORANGE: '#c19009',
        TYPE_LIGHT_ORANGE: '#FDFBF5',
        TYPE_DARK_ORANGE: '#B47229', // used in Warning, provides better contrast than TYPE_ORANGE, comes from Suite 2.0 design
        TYPE_BLUE: '#1d88c5',
        TYPE_RED: '#cd4949',
        TYPE_DARK_GREY: '#1F1F1F',
        TYPE_LIGHT_GREY: '#808080',
        TYPE_LIGHTER_GREY: '#bdbdbd',
        TYPE_WHITE: '#ffffff',
        TYPE_SECONDARY_TEXT: '#00854D',

        STROKE_GREY: '#e8e8e8',
        STROKE_GREY_ALT: '#e8e8e8',
        STROKE_LIGHT_GREY: '#f4f4f4',

        BUTTON_RED: '#cd4949',
        BUTTON_RED_HOVER: '#b93c3c',

        GRADIENT_SKELETON_START: '#eaeaea',

        GRADIENT_GREEN_START: '#00854D',
        GRADIENT_GREEN_END: '#4cbc26',
        GRADIENT_RED_START: '#d15b5b',
        GRADIENT_RED_END: '#e75f5f',

        GRADIENT_SLIDER_GREEN_START: '#2A9649',
        GRADIENT_SLIDER_GREEN_END: '#95CDA5',
        GRADIENT_SLIDER_YELLOW_START: '#C8B883',
        GRADIENT_SLIDER_YELLOW_END: '#C8B882',
        GRADIENT_SLIDER_RED_END: '#BF6767',

        BOX_SHADOW_BLACK_5: 'rgba(0, 0, 0, 0.05)',
        BOX_SHADOW_BLACK_15: 'rgba(0, 0, 0, 0.15)',
        BOX_SHADOW_BLACK_20: 'rgba(0, 0, 0, 0.2)',
        BOX_SHADOW_MODAL: 'rgba(77, 77, 77, 0.2)',
        BOX_SHADOW_OPTION_CARD: 'rgba(77, 77, 77, 0.12)',

        HOVER_PRIMER_COLOR: '#000',
        HOVER_TRANSPARENTIZE_FILTER: 0.96,
        HOVER_DARKEN_FILTER: 0.06,
        HOVER_TRANSITION_TIME: '150ms',
        HOVER_TRANSITION_EFFECT: 'ease-out',

        DARKEN_20_PERCENT_FILTER: 0.2,
    },
    dark: {
        THEME: 'dark',

        BG_GREEN: '#00854D',
        BG_GREEN_HOVER: '#007837', // improvisation
        BG_LIGHT_GREEN: '#1E332C',
        BG_SECONDARY: '#3A3B3C', // special color for secondary button bg, in dark mode it is same as tertiary
        BG_SECONDARY_HOVER: '#2E2F30', // special color for secondary button bg, in dark mode it is same as tertiary
        BG_LIGHT_GREEN_HOVER: '#131d10', // improvisation
        BG_GREY: '#18191a',
        BG_GREY_OPEN: '#141414', // used for main menu active state
        BG_GREY_ALT: '#3a3b3c', // used for selected account item, account search input, tertiary buttons
        BG_LIGHT_GREY: '#212223',
        BG_WHITE: '#242526',
        BG_WHITE_ALT: '#3a3b3c',
        BG_WHITE_ALT_HOVER: '#444546',
        BG_RED: '#ab2626', // used for big app notification
        BG_LIGHT_RED: '#312828', // used for outer glow for disconnected device status dot
        BG_TOOLTIP: '#3a3b3c', // same as STROKE_GREY in dark theme
        BG_ICON: '#ffffff',

        TYPE_GREEN: '#00854D',
        TYPE_ORANGE: '#9b813b',
        TYPE_LIGHT_ORANGE: '#272714',
        TYPE_DARK_ORANGE: '#F7BF2F', // used in Warning, provides better contrast than TYPE_ORANGE, comnes from Suite 2.0 design
        TYPE_BLUE: '#197eaa',
        TYPE_RED: '#c65353',
        TYPE_DARK_GREY: '#eaebed',
        TYPE_LIGHT_GREY: '#959596',
        TYPE_LIGHTER_GREY: '#bdbdbd',
        TYPE_WHITE: '#fafafa',
        TYPE_SECONDARY_TEXT: '#ffffff',

        STROKE_GREY: '#3a3b3c',
        STROKE_GREY_ALT: '#5c5d5e', // used for light border on BG_WHITE_ALT in dark mode
        STROKE_LIGHT_GREY: '#3a3b3c', // graph grid uses different color in black theme

        BUTTON_RED: '#cd4949',
        BUTTON_RED_HOVER: '#b93c3c',

        GRADIENT_SKELETON_START: '#272729',
        // these gradients are used on transaction graph only
        GRADIENT_GREEN_START: '#00854D',
        GRADIENT_GREEN_END: '#5fa548',
        GRADIENT_RED_START: '#d15b5b', // same as in light theme
        GRADIENT_RED_END: '#e75f5f', // same as in light theme

        GRADIENT_SLIDER_GREEN_START: '#2A9649',
        GRADIENT_SLIDER_GREEN_END: '#95CDA5',
        GRADIENT_SLIDER_YELLOW_START: '#C8B883',
        GRADIENT_SLIDER_YELLOW_END: '#C8B882',
        GRADIENT_SLIDER_RED_END: '#BF6767',

        BOX_SHADOW_BLACK_5: 'rgba(255, 255, 255, 0.05)',
        BOX_SHADOW_BLACK_15: 'rgba(0, 0, 0, 0.2)',
        BOX_SHADOW_BLACK_20: 'rgba(0, 0, 0, 0.2)', // shadow around dropdown
        BOX_SHADOW_MODAL: 'rgba(0, 0, 0, 0.5)', // shadow around modal
        BOX_SHADOW_OPTION_CARD: 'rgba(0, 0, 0, 0.2)', // shadow around Options card in onboarding,
        IMAGE_FILTER: 'brightness(0.8) contrast(1.2) saturate(1.2)',

        HOVER_PRIMER_COLOR: '#fff',
        HOVER_TRANSPARENTIZE_FILTER: 0.96,
        HOVER_DARKEN_FILTER: -0.04,
        HOVER_TRANSITION_TIME: '150ms',
        HOVER_TRANSITION_EFFECT: 'ease-out',

        DARKEN_20_PERCENT_FILTER: -0.2,
    },
    // black theme is not used currently, but will be in the future
    black: {
        THEME: 'black',

        BG_GREEN: '#e3ede0',
        BG_GREEN_HOVER: '#007837', // improvisation
        BG_LIGHT_GREEN: '#1E332C',
        BG_LIGHT_GREEN_HOVER: '#131d10', // improvisation
        BG_SECONDARY: '#3A3B3C', // TODO
        BG_SECONDARY_HOVER: '#2E2F30', // TODO
        BG_GREY: '#000000',
        BG_GREY_OPEN: '#141414', // TODO
        BG_GREY_ALT: '#262626', // used for selected account item, account search input, tertiary buttons
        BG_LIGHT_GREY: '#0c0c0c',
        BG_WHITE: '#101010',
        BG_WHITE_ALT: '#3a3b3c', // TODO
        BG_WHITE_ALT_HOVER: '#444546', // TODO
        BG_RED: '#ab2626', // used for big app notification
        BG_LIGHT_RED: '#312828', // used for outer glow for disconnected device status dot
        BG_TOOLTIP: '#151524', // todo
        BG_ICON: '#ffffff', // todo

        TYPE_GREEN: '#6fa95c',
        TYPE_ORANGE: '#9b813b',
        TYPE_LIGHT_ORANGE: '#272714',
        TYPE_DARK_ORANGE: '#F7BF2F', // used in Warning, provides better contrast than TYPE_ORANGE, comnes from Suite 2.0 design
        TYPE_BLUE: '#197eaa',
        TYPE_RED: '#c65353',
        TYPE_DARK_GREY: '#fafafa',
        TYPE_LIGHT_GREY: '#8e8e8e',
        TYPE_LIGHTER_GREY: '#bdbdbd',
        TYPE_WHITE: '#fafafa',

        STROKE_GREY: '#262626',
        STROKE_GREY_ALT: '#262626',
        STROKE_LIGHT_GREY: '#1a1a1a', // graph grid

        BUTTON_RED: '#cd4949',
        BUTTON_RED_HOVER: '#b93c3c',

        GRADIENT_SKELETON_START: '#272729',
        // these gradients are used on transaction graph only
        GRADIENT_GREEN_START: '#00854D',
        GRADIENT_GREEN_END: '#5fa548',
        GRADIENT_RED_START: '#d15b5b', // same as in light theme
        GRADIENT_RED_END: '#e75f5f', // same as in light theme

        GRADIENT_SLIDER_GREEN_START: '#2A9649',
        GRADIENT_SLIDER_GREEN_END: '#95CDA5',
        GRADIENT_SLIDER_YELLOW_START: '#C8B883',
        GRADIENT_SLIDER_YELLOW_END: '#C8B882',
        GRADIENT_SLIDER_RED_END: '#BF6767',

        BOX_SHADOW_BLACK_5: 'rgba(255, 255, 255, 0.05)',
        BOX_SHADOW_BLACK_15: 'rgba(0, 0, 0, 0.2)',
        BOX_SHADOW_BLACK_20: 'rgba(255, 255, 255, 0.1)', // shadow around dropdown
        BOX_SHADOW_MODAL: 'rgba(0, 0, 0, 0.5)', // shadow around modal
        BOX_SHADOW_OPTION_CARD: 'rgba(0, 0, 0, 0.2)', // shadow around Options card in onboarding,
        IMAGE_FILTER: 'brightness(0.8) contrast(1.2) saturate(1.2)',

        HOVER_PRIMER_COLOR: '#fff',
        HOVER_TRANSPARENTIZE_FILTER: 0.96,
        HOVER_DARKEN_FILTER: -0.04,
        HOVER_TRANSITION_TIME: '150ms',
        HOVER_TRANSITION_EFFECT: 'ease-out',

        DARKEN_20_PERCENT_FILTER: -0.2,
    },
} as const;

const oldColors = {
    // TODO: some colors from old design that are waiting to be reworked into NEUE design
    GREEN: '#30C101', // used by password strength indicator
    YELLOW: '#fdcb33', // used by password strength indicator
    RED: '#cd4949', // used by password strength indicator
} as const;

export const colors = { ...oldColors, ...THEME.light } as const;

export const intermediaryTheme = {
    light: { ...THEME.light, ...colorVariants.standard },
    dark: { ...THEME.dark, ...colorVariants.dark },
};
