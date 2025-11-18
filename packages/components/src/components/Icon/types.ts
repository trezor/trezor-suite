import { UIVariant } from '../../config/types';

export const iconVariants = [
    'primary',
    'tertiary',
    'default',
    'info',
    'warning',
    'destructive',
] as const;

export type IconVariant = Extract<UIVariant, (typeof iconVariants)[number]>;

export const iconSizes = [8, 12, 16, 20, 24, 32, 40, 48] as const;
export type IconSize = (typeof iconSizes)[number];
