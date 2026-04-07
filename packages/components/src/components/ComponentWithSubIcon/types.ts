import { type UIIntent } from '../../config/types';

export const componentWithSubIconIntents = [
    'brand',
    'neutral',
    'info',
    'warning',
    'critical',
    'accentViolet',
] as const satisfies UIIntent[];
export type ComponentWithSubIconIntent = Extract<
    UIIntent,
    (typeof componentWithSubIconIntents)[number]
>;
