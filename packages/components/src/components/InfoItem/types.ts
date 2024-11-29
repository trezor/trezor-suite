import { UIVerticalAlignment, UIVariant } from '../../config/types';

export const infoItemVerticalAlignments = ['top', 'center', 'bottom'] as const;
export type InfoItemVerticalAlignment = Extract<
    UIVerticalAlignment,
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
