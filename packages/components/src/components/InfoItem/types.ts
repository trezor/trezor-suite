import { type UIAlignment } from '../../config/types';

export const infoItemVerticalAlignments = ['start', 'center', 'end'] as const;
export type InfoItemVerticalAlignment = Extract<
    UIAlignment,
    (typeof infoItemVerticalAlignments)[number]
>;
