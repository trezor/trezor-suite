import { CSSColor } from './types';

export const defaultColorVariant = {
    green: '#00854D',
    forest: '#0F6148',

    yellow: '#F7BF2F',
    blue: '#0078AC',
    red: '#CD4949',

    // standard theme is defined here, because this object is used as default type shape of colors
    gray1000: '#141414',
    gray900: '#1F1F1F',
    gray800: '#333333',
    gray700: '#545454',
    gray600: '#757575',
    gray500: '#AFAFAF',
    gray400: '#CBCBCB',
    gray300: '#E2E2E2',
    gray200: '#EEEEEE',
    gray100: '#F6F6F6',
    gray0: '#FFFFFF',
} as const;

export type Color = keyof typeof defaultColorVariant;

export type Colors = Record<Color, CSSColor>;

export const colorVariants = {
    standard: {
        ...defaultColorVariant,
    },
    chill: {
        ...defaultColorVariant,
        gray1000: '#1B1A19',
        gray900: '#1E1D1D',
        gray800: '#353432',
        gray700: '#54524E',
        gray600: '#7B7974',
        gray500: '#A7A59C',
        gray400: '#D8D3C8',
        gray300: '#F0EDE6',
        gray200: '#F5F3EF',
        gray100: '#FAF8F3',
        gray0: '#ECECEC',
    },
    dark: {
        ...defaultColorVariant,
        gray1000: '#FFFFFF',
        gray900: '#F4F4F4',
        gray800: '#E1E1E1',
        gray700: '#C2C2C2',
        gray600: '#8F9190',
        gray500: '#4E504F',
        gray400: '#373938',
        gray300: '#242524',
        gray200: '#1C1E1C',
        gray100: '#161716',
        gray0: '#000000',
    },
} as const;

export type ThemeColorVariant = keyof typeof colorVariants;
