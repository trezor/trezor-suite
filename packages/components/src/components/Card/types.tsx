export const paddingTypes = ['small', 'none', 'normal', 'large'] as const;
export type PaddingType = (typeof paddingTypes)[number];

export const fillTypes = ['none', 'default'] as const;
export type FillType = (typeof fillTypes)[number];
