import { CSSColor } from './types';

export const colorVariants = {
    standard: {
        forest: '#0F6148',
        forest100: '#EDFCF8',
        forest200: '#CEF7EB',
        forest700: '#189A73',
        forest800: '#0F6148',
        forest900: '#0A4231',

        green: '#00854D',
        green100: '#EBFFF7',
        green200: '#C7FFE8',
        green700: '#00B368',
        green800: '#00854D',
        green900: '#004D2D',

        blue: '#0078AC',
        blue100: '#EBF9FF',
        blue200: '#C7EEFF',
        blue600: '#0078AC',
        blue700: '#004766',

        red: '#CD4949',
        red100: '#FBEFEF',
        red200: '#F3D3D3',
        red600: '#CD4949',
        red700: '#B83333',

        yellow: '#F7BF2F',
        yellow100: '#FEF9EB',
        yellow200: '#FDEEC9',
        yellow600: '#F7BF2F',
        yellow700: '#E2A508',

        gray1000: '#171717',
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
    },
    dark: {
        forest: '#61DBB7',
        forest100: '#0D211B',
        forest200: '#0E2F25',
        forest700: '#2ECC9C',
        forest800: '#61DBB7',
        forest900: '#A7F1DB',

        green: '#2FBC81',
        green100: '#092519',
        green200: '#0C3122',
        green700: '#259365',
        green800: '#2FBC81',
        green900: '#74DCB1',

        blue: '#1A6E92',
        blue100: '#071D27',
        blue200: '#092734',
        blue600: '#1A6E92',
        blue700: '#1F83AD',

        red: '#AC3E3E',
        red100: '#220C0C',
        red200: '#2D1010',
        red600: '#AC3E3E',
        red700: '#C25656',

        yellow: '#CB9B20',
        yellow100: '#281E06',
        yellow200: '#352808',
        yellow600: '#CB9B20',
        yellow700: '#E0B138',

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

export type Color = keyof typeof colorVariants.standard;

export type Colors = Record<Color, CSSColor>;

export type ThemeColorVariant = keyof typeof colorVariants;
