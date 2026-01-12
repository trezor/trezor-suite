import { UIAlignment } from '../../../config/types';

export const labelAlignments = ['start', 'end'] as const;
export type LabelAlignment = Extract<UIAlignment, (typeof labelAlignments)[number]>;

export const verticalAlignments = ['start', 'center'] as const;
export type VerticalAlignment = Extract<UIAlignment, (typeof verticalAlignments)[number]>;
