export const paddingTypes = ['tiny', 'small', 'none', 'normal', 'large'] as const;
export type PaddingType = (typeof paddingTypes)[number];

export const cardTypes = ['raised', 'sunken', 'flat', 'contrast'] as const;
export type CardType = (typeof cardTypes)[number];
