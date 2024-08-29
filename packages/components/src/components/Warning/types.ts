import { UIVariant } from '../../config/types';

export const warningVariants = ['primary', 'info', 'warning', 'destructive', 'tertiary'] as const;

export type WarningVariant = Extract<UIVariant, (typeof warningVariants)[number]>;
