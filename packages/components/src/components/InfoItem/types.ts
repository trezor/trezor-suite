import { UIAlignment, UIVariant } from '../../config/types';

export const infoItemVerticalAlignments = ['start', 'center', 'end'] as const;
export type InfoItemVerticalAlignment = Extract<
    UIAlignment,
    (typeof infoItemVerticalAlignments)[number]
>;

export const infoItemVariants = [
    'primary',
    'tertiary',
    'default',
    'info',
    'warning',
    'destructive',
    'purple',
    'disabled',
] as const;
export type InfoItemVariant = Extract<UIVariant, (typeof infoItemVariants)[number]>;
