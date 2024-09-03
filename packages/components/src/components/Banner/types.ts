import { UIVariant } from '../../config/types';

export const bannerVariants = ['primary', 'info', 'warning', 'destructive', 'tertiary'] as const;

export type BannerVariant = Extract<UIVariant, (typeof bannerVariants)[number]>;
