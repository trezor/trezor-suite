import { type UIIntent, type UISize } from '../../config/types';

export const badgeIntents = ['brand', 'neutral', 'info', 'warning', 'critical'] as const;
export type BadgeIntent = Extract<UIIntent, (typeof badgeIntents)[number]>;

export const badgeSizes = ['medium', 'small'] as const;
export type BadgeSize = Extract<UISize, (typeof badgeSizes)[number]>;
