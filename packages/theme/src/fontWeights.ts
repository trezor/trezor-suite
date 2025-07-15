// RN require font weight to be string
export const fontWeights = {
    medium: '500',
    semiBold: '600',
    bold: '700',
} as const;

export type FontWeight = keyof typeof fontWeights;
export type FontWeightValue = (typeof fontWeights)[FontWeight];
export type FontWeights = Record<FontWeight, FontWeightValue>;
