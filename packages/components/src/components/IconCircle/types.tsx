import { UIVariant, UISize } from '../../config/types';

export const iconCircleVariants = [
    'primary',
    'warning',
    'destructive',
    'info',
    'tertiary',
] as const;

export type IconCircleVariant = Extract<UIVariant, (typeof iconCircleVariants)[number]>;

export const iconCirclePaddingTypes = ['small', 'medium', 'large'] as const;
export type IconCirclePaddingType = Extract<UISize, (typeof iconCirclePaddingTypes)[number]>;
