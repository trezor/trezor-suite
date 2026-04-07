import { type UIIntent, type UIPriority } from '../../../config/types';

export const textIntents = [
    'neutral',
    'brand',
    'info',
    'warning',
    'critical',
    'accentViolet',
] as const satisfies UIIntent[];
export type TextIntent = Extract<UIIntent, (typeof textIntents)[number]>;

export const textPriorities = ['primary', 'secondary'] as const satisfies UIPriority[];
export type TextPriority = Extract<UIPriority, (typeof textPriorities)[number]>;
