import { type UIAlignment, type UIIntent } from '../../config/types';

export const modalIntents = [
    'brand',
    'neutral',
    'info',
    'warning',
    'critical',
    'accentViolet',
    'accentOrange',
] as const satisfies UIIntent[];
export type ModalIntent = Extract<UIIntent, (typeof modalIntents)[number]>;

export const modalWidths = [400, 480, 600, 680, 760, 960] as const;
export type ModalWidth = (typeof modalWidths)[number];

export type ModalAlignment = { x: UIAlignment; y: UIAlignment };
