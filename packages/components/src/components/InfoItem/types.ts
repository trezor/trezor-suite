import { UIVerticalAlignment } from '../../config/types';

export const infoItemVerticalAlignments = ['top', 'center', 'bottom'] as const;
export type InfoItemVerticalAlignment = Extract<
    UIVerticalAlignment,
    (typeof infoItemVerticalAlignments)[number]
>;
