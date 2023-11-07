export const fontFamilies = {
    base: "'TT Satoshi', 'Open Sans', -apple-system, 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
} as const;

export type FontFamilies = typeof fontFamilies;

export const nativeFontFamilies = {
    m: 'TTSatoshi-Medium',
    semiBold: 'TTSatoshi-DemiBold',
} as const;

export type NativeFontFamilies = typeof nativeFontFamilies;

export type NativeFont = NativeFontFamilies[keyof NativeFontFamilies];
