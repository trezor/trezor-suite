import { UIAlignment, UIVariant } from '../../config/types';

export const modalVariants = ['primary', 'warning', 'destructive', 'info'] as const;
export type ModalVariant = Extract<UIVariant, (typeof modalVariants)[number]>;

export const modalWidths = [400, 480, 600, 680, 760, 960] as const;
export type ModalWidth = (typeof modalWidths)[number];

export type ModalAlignment = { x: UIAlignment; y: UIAlignment };
