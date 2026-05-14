import { type UIIntent, type UIPriority } from '../../config/types';

export const iconIntents = [
    'neutral',
    'brand',
    'info',
    'warning',
    'critical',
    'accentViolet',
] as const satisfies UIIntent[];
export type IconIntent = Extract<UIIntent, (typeof iconIntents)[number]>;

export const iconPriorities = ['primary', 'secondary'] as const satisfies UIPriority[];
export type IconPriority = Extract<UIPriority, (typeof iconPriorities)[number]>;

export const iconSizes = [8, 12, 16, 20, 24, 32, 40, 48] as const;
export type IconSize = (typeof iconSizes)[number] | number;
