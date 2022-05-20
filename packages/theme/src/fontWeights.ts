// RN require font weight to be string
export const fontWeights = {
    normal: '400',
    medium: '500',
    semiBold: '600',
} as const;

export type FontWeight = keyof typeof fontWeights;
export type FontWeightValue = typeof fontWeights[FontWeight];
export type FontWeights = Record<FontWeight, FontWeightValue>;
