// TODO: button hover color could be derived from its based color by applying something like opacity/darkening
// same goes for gradients

export const THEME = {
    light: {
        BG_GREEN: '#39a814',
        BG_LIGHT_GREEN: '#effaec',
        BG_SECONDARY: '#effaec', // used for secondary button, in light mode same as LIGHT_GREEN
        BG_SECONDARY_HOVER: '#e8f3e5',
        BG_GREEN_HOVER: '#339714',
        BG_LIGHT_GREEN_HOVER: '#e8f3e5',
        BG_GREY: '#f4f4f4',
        BG_GREY_ALT: '#f4f4f4',
        BG_LIGHT_GREY: '#fcfcfc',
        BG_WHITE: '#ffffff',
        BG_WHITE_ALT: '#ffffff', // used for dropdown menus
        BG_WHITE_ALT_HOVER: '#f4f4f4', // used for dropdown menus
        BG_BLUE: '#1faaff',
        BG_RED: '#d04949',
        BG_LIGHT_RED: '#F6E2E2',
        BG_TOOLTIP: '#262742',
        BG_ICON: 'transparent',

        TYPE_GREEN: '#279503',
        TYPE_ORANGE: '#c19009',
        TYPE_BLUE: '#197eaa',
        TYPE_RED: '#cd4949',
        TYPE_DARK_GREY: '#404040',
        TYPE_LIGHT_GREY: '#808080',
        TYPE_LIGHTER_GREY: '#bdbdbd',
        TYPE_WHITE: '#ffffff',

        SCROLLBAR_THUMB: '#dcdcdc',
        STROKE_GREY: '#e8e8e8',
        STROKE_GREY_ALT: '#e8e8e8',
        STROKE_LIGHT_GREY: '#f4f4f4',

        BUTTON_RED: '#cd4949',
        BUTTON_RED_HOVER: '#b93c3c',

        GRADIENT_SKELETON_START: '#eaeaea',

        GRADIENT_GREEN_START: '#39a814',
        GRADIENT_GREEN_END: '#4cbc26',
        GRADIENT_RED_START: '#d15b5b',
        GRADIENT_RED_END: '#e75f5f',

        BOX_SHADOW_BLACK_5: 'rgba(0, 0, 0, 0.05)',
        BOX_SHADOW_BLACK_15: 'rgba(0, 0, 0, 0.15)',
        BOX_SHADOW_BLACK_20: 'rgba(0, 0, 0, 0.2)',
        BOX_SHADOW_MODAL: 'rgba(77, 77, 77, 0.2)',
    },
    dark: {
        BG_GREEN: '#5ea447',
        BG_GREEN_HOVER: '#4e883b', // improvisation
        BG_LIGHT_GREEN: '#1a2516',
        BG_SECONDARY: '#3a3b3c', // special color for secondary button bg, in dark mode it is same as tertiary
        BG_SECONDARY_HOVER: '#373839', // special color for secondary button bg, in dark mode it is same as tertiary
        BG_LIGHT_GREEN_HOVER: '#131d10', // improvisation
        BG_GREY: '#18191a',
        BG_GREY_ALT: '#3a3b3c', // used for selected account item, account search input, tertiary buttons
        BG_LIGHT_GREY: '#212223',
        BG_WHITE: '#242526',
        BG_WHITE_ALT: '#3a3b3c',
        BG_WHITE_ALT_HOVER: '#444546',
        BG_BLUE: '#197eaa', // used for big app notification (eg. new fw update)
        BG_RED: '#ab2626', // used for big app notification
        BG_LIGHT_RED: '#5a1616', // used for outer glow for disconnected device status dot
        BG_TOOLTIP: '#3a3b3c', // same as STROKE_GREY in dark theme
        BG_ICON: '#ffffff',

        TYPE_GREEN: '#66ab4e',
        TYPE_ORANGE: '#9b813b',
        TYPE_BLUE: '#197eaa',
        TYPE_RED: '#c65353',
        TYPE_DARK_GREY: '#eaebed',
        TYPE_LIGHT_GREY: '#959596',
        TYPE_LIGHTER_GREY: '#bdbdbd',
        TYPE_WHITE: '#fafafa',

        SCROLLBAR_THUMB: '#7F7F7F',
        STROKE_GREY: '#3a3b3c',
        STROKE_GREY_ALT: '#5c5d5e', // used for light border on BG_WHITE_ALT in dark mode
        STROKE_LIGHT_GREY: '#3a3b3c', // graph grid uses different color in black theme

        BUTTON_RED: '#cd4949',
        BUTTON_RED_HOVER: '#b93c3c',

        GRADIENT_SKELETON_START: '#272729',
        // these gradients are used on transaction graph only
        GRADIENT_GREEN_START: '#559c3d',
        GRADIENT_GREEN_END: '#5fa548',
        GRADIENT_RED_START: '#d15b5b', // same as in light theme
        GRADIENT_RED_END: '#e75f5f', // same as in light theme

        BOX_SHADOW_BLACK_5: 'rgba(255, 255, 255, 0.05)',
        BOX_SHADOW_BLACK_15: 'rgba(0, 0, 0, 0.2)',
        BOX_SHADOW_BLACK_20: 'rgba(0, 0, 0, 0.2)', // shadow around dropdown
        BOX_SHADOW_MODAL: 'rgba(0, 0, 0, 0.5)', // shadow around modal
        IMAGE_FILTER: 'brightness(0.8) contrast(1.2) saturate(1.2)',
    },
    // black theme is not used currently, but will be in the future
    black: {
        BG_GREEN: '#5ea447',
        BG_GREEN_HOVER: '#4e883b', // improvisation
        BG_LIGHT_GREEN: '#1a2516',
        BG_LIGHT_GREEN_HOVER: '#131d10', // improvisation
        BG_SECONDARY: '#3a3b3c', // TODO
        BG_SECONDARY_HOVER: '#373839', // TODO
        BG_GREY: '#000000',
        BG_GREY_ALT: '#262626', // used for selected account item, account search input, tertiary buttons
        BG_LIGHT_GREY: '#0c0c0c',
        BG_WHITE: '#101010',
        BG_WHITE_ALT: '#3a3b3c', // TODO
        BG_WHITE_ALT_HOVER: '#444546', // TODO
        BG_BLUE: '#197eaa', // used for big app notification (eg. new fw update)
        BG_RED: '#ab2626', // used for big app notification
        BG_LIGHT_RED: '#5a1616', // used for outer glow for disconnected device status dot
        BG_TOOLTIP: '#151524', // todo
        BG_ICON: '#ffffff', // todo

        TYPE_GREEN: '#6fa95c',
        TYPE_ORANGE: '#9b813b',
        TYPE_BLUE: '#197eaa',
        TYPE_RED: '#c65353',
        TYPE_DARK_GREY: '#fafafa',
        TYPE_LIGHT_GREY: '#8e8e8e',
        TYPE_LIGHTER_GREY: '#bdbdbd',
        TYPE_WHITE: '#fafafa',

        SCROLLBAR_THUMB: '#7F7F7F',
        STROKE_GREY: '#262626',
        STROKE_GREY_ALT: '#262626',
        STROKE_LIGHT_GREY: '#1a1a1a', // graph grid

        BUTTON_RED: '#cd4949',
        BUTTON_RED_HOVER: '#b93c3c',

        GRADIENT_SKELETON_START: '#272729',
        // these gradients are used on transaction graph only
        GRADIENT_GREEN_START: '#559c3d',
        GRADIENT_GREEN_END: '#5fa548',
        GRADIENT_RED_START: '#d15b5b', // same as in light theme
        GRADIENT_RED_END: '#e75f5f', // same as in light theme

        BOX_SHADOW_BLACK_5: 'rgba(255, 255, 255, 0.05)',
        BOX_SHADOW_BLACK_15: 'rgba(0, 0, 0, 0.2)',
        BOX_SHADOW_BLACK_20: 'rgba(255, 255, 255, 0.1)', // shadow around dropdown
        BOX_SHADOW_MODAL: 'rgba(0, 0, 0, 0.5)', // shadow around modal
        IMAGE_FILTER: 'brightness(0.8) contrast(1.2) saturate(1.2)',
    },
} as const;

const oldColors = {
    // TODO: some colors from old design that are waiting to be reworked into NEUE design
    GREEN: '#30C101', // used by password strength indicator
    YELLOW: '#fdcb33', // used by password strength indicator
    RED: '#cd4949', // used by password strength indicator
} as const;

const colors = { ...oldColors, ...THEME.light } as const;

export default colors;
