import { UIAlignment, UISize, UIVariant } from '../../config/types';

export const modalVariants = ['primary', 'warning', 'destructive', 'info'] as const;
export type ModalVariant = Extract<UIVariant, (typeof modalVariants)[number]>;

export const modalSizes = ['huge', 'large', 'medium', 'small', 'tiny'] as const;
export type ModalSize = Extract<UISize, (typeof modalSizes)[number]>;

export type ModalAlignment = { x: UIAlignment; y: UIAlignment };
