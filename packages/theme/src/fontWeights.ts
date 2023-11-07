// RN require font weight to be string
export const fontWeights = {
    m: '500',
    semiBold: '600',
} as const;

export type FontWeight = keyof typeof fontWeights;
export type FontWeightValue = (typeof fontWeights)[FontWeight];
export type FontWeights = Record<FontWeight, FontWeightValue>;
