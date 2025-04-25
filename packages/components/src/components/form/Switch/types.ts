import { UIAlignment, UISize } from '../../../config/types';

export const switchSizes = ['medium', 'small'] as const;
export type SwitchSize = Extract<UISize, (typeof switchSizes)[number]>;

export const switchLabelPositions = ['start', 'end'] as const;
export type SwitchLabelPosition = Extract<UIAlignment, (typeof switchLabelPositions)[number]>;
