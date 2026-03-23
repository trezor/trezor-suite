import { type UIIntent } from '../../config/types';

export const bannerIntents = ['brand', 'info', 'warning', 'critical', 'neutral'] as const;

export type BannerIntent = Extract<UIIntent, (typeof bannerIntents)[number]>;
