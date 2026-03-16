import { type UIIntent } from '../../config/types';

export const iconCircleIntents = [
    'brand',
    'neutral',
    'info',
    'warning',
    'critical',
    'accentViolet',
    'accentOrange',
] as const satisfies UIIntent[];
export type IconCircleIntent = Extract<UIIntent, (typeof iconCircleIntents)[number]>;

export const iconCircleSizes = [16, 24, 32, 40, 96, 112] as const;
export type IconCircleSize = (typeof iconCircleSizes)[number];
