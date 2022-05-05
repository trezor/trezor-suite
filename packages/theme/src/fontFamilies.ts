export const fontFamilies = {
    base: "'TT Satoshi', 'Open Sans', -apple-system, 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
} as const;

export type FontFamilies = typeof fontFamilies;

export const nativeFontFamilies: Record<keyof typeof fontFamilies, string> = {
    base: 'TTSatoshi-Regular',
} as const;

export type NativeFontFamilies = typeof nativeFontFamilies;
