import { UIVariant } from '../../config/types';

export const warningVariants = [
    'primary',
    'secondary',
    'info',
    'warning',
    'destructive',
    'tertiary',
] as const;

export type WarningVariant = Extract<UIVariant, (typeof warningVariants)[number]>;
