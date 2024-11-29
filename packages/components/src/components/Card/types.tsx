import { UIVariant } from '../../config/types';

export const paddingTypes = ['small', 'none', 'normal', 'large'] as const;
export type PaddingType = (typeof paddingTypes)[number];

export const fillTypes = ['none', 'default'] as const;
export type FillType = (typeof fillTypes)[number];

export const cardVariants = ['primary', 'warning'] as const;
export type CardVariant = Extract<UIVariant, (typeof cardVariants)[number]>;
