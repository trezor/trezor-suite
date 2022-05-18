import type * as CSS from 'csstype';

const defaultColorVariant = {
    green: '#00854D',
    green20: 'rgba(0, 133, 77, 0.2)',
    green10: 'rgba(0, 133, 77, 0.1)',
    forest: '#0F6148',

    yellow: '#EFC941',
    blue: '#0078AC',
    red: '#CD4949',
    red5: 'rgba(205, 73, 73, 0.05)',

    // standard theme is defined here, because this object is used as default type shape of colors
    black: '#141414',
    white: '#FFFFFF',
    gray900: '#1F1F1F',
    gray800: '#333333',
    gray700: '#545454',
    gray600: '#757575',
    gray500: '#AFAFAF',
    gray400: '#CBCBCB',
    gray300: '#E2E2E2',
    gray200: '#EEEEEE',
    gray100: '#F6F6F6',
} as const;

export type Color = keyof typeof defaultColorVariant;

export type Colors = Record<Color, CSS.Property.Color>;

export const colorVariants = {
    standard: {
        ...defaultColorVariant,
    },
    chill: {
        ...defaultColorVariant,
        black: '#1B1A19',
        white: '#ECECEC',
        gray900: '#1E1D1D',
        gray800: '#353432',
        gray700: '#54524E',
        gray600: '#7B7974',
        gray500: '#A7A59C',
        gray400: '#D8D3C8',
        gray300: '#F0EDE6',
        gray200: '#F5F3EF',
        gray100: '#FAF8F3',
    },
    dark: {
        ...defaultColorVariant,
        black: '#000000',
        white: '#ECECEC',
        gray900: '#161716',
        gray800: '#1C1E1C',
        gray700: '#242524',
        gray600: '373938',
        gray500: '#4E504F',
        gray400: '#8F9190',
        gray300: '#C2C2C2',
        gray200: '#E1E1E1',
        gray100: '#F4F4F4',
    },
} as const;

export type ThemeColorVariant = keyof typeof colorVariants;
