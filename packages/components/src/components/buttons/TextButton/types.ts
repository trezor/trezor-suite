import { UISize } from '../../../config/types';

export const textButtonSizes = ['large', 'small'] as const;
export type TextButtonSize = Extract<UISize, (typeof textButtonSizes)[number]>;
