import { UIVariant, UISize, UIHorizontalAlignment, UIVerticalAlignment } from '../../config/types';

export const newModalVariants = ['primary', 'warning', 'destructive'] as const;
export type NewModalVariant = Extract<UIVariant, (typeof newModalVariants)[number]>;

export const newModalSizes = ['large', 'medium', 'small', 'tiny'] as const;
export type NewModalSize = Extract<UISize, (typeof newModalSizes)[number]>;

export type NewModalAlignment = { x: UIHorizontalAlignment; y: UIVerticalAlignment };
