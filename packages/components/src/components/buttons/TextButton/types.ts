import { type UIPriority, type UISize } from '../../../config/types';

export const textButtonSizes = ['large', 'small'] as const;
export type TextButtonSize = Extract<UISize, (typeof textButtonSizes)[number]>;

export const textButtonPriorities = ['primary', 'secondary', 'tertiary'] as const;
export type TextButtonPriority = Extract<UIPriority, (typeof textButtonPriorities)[number]>;
