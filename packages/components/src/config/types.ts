export const uiVariants = [
    'primary',
    'secondary',
    'tertiary',
    'info',
    'warning',
    'destructive',
] as const;
export type UIVariant = (typeof uiVariants)[number];

export const uiSizes = ['large', 'medium', 'small', 'tiny'] as const;
export type UISize = (typeof uiSizes)[number];

export type UIHorizontalAlignment = 'left' | 'center' | 'right';
export type UIVerticalAlignment = 'top' | 'center' | 'bottom';
