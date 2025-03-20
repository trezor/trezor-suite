import { UIVariant } from '../../config/types';

export const paddingTypes = ['tiny', 'small', 'none', 'normal', 'large'] as const;
export type PaddingType = (typeof paddingTypes)[number];

export const fillTypes = ['flat', 'default'] as const;
export type FillType = (typeof fillTypes)[number];

export const cardVariants = ['primary', 'warning'] as const;
export type CardVariant = Extract<UIVariant, (typeof cardVariants)[number]>;
