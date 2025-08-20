import { UIIntent, UIPriority, UISize } from '../../../config/types';

export const newButtonIntents = ['brand', 'neutral', 'info', 'warning', 'critical'] as const;
export type NewButtonIntent = Extract<UIIntent, (typeof newButtonIntents)[number]>;

export const newButtonSizes = ['large', 'medium', 'small'] as const;
export type NewButtonSize = Extract<UISize, (typeof newButtonSizes)[number]>;

export const newButtonPriorities = ['primary', 'secondary'] as const;
export type NewButtonPriority = Extract<UIPriority, (typeof newButtonPriorities)[number]>;
