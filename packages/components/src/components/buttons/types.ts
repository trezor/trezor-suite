import { UIIntent, UIPriority, UISize } from '../../config/types';

export const buttonIntents = ['brand', 'neutral', 'info', 'warning', 'critical'] as const;
export type ButtonIntent = Extract<UIIntent, (typeof buttonIntents)[number]>;

export const buttonSizes = ['large', 'medium', 'small'] as const;
export type ButtonSize = Extract<UISize, (typeof buttonSizes)[number]>;

export const buttonPriorities = ['primary', 'secondary'] as const;
export type ButtonPriority = Extract<UIPriority, (typeof buttonPriorities)[number]>;
