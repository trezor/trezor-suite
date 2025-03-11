import { UISize } from '../../../config/types';

export const selectBarOrientations = ['horizontal', 'vertical', 'auto'] as const;
export type SelectBarOrientation = (typeof selectBarOrientations)[number];

export const selectBarSizes = ['large', 'small'] as const;
export type SelectBarSize = Extract<UISize, (typeof selectBarSizes)[number]>;
