import { type UIIntent } from '../../config/types';

export const illustrationIntents = ['brand', 'info', 'critical', 'warning'] as const;
export type IllustrationIntent = Extract<UIIntent, (typeof illustrationIntents)[number]>;
