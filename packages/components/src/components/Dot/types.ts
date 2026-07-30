import { type UIIntent } from '../../config/types';

export const dotIntents = [
    'brand',
    'neutral',
    'info',
    'warning',
    'critical',
    'accentViolet',
] as const satisfies UIIntent[];

export type DotIntent = Extract<UIIntent, (typeof dotIntents)[number]>;
