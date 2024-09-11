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

export const uiHorizontalAlignments = ['left', 'center', 'right'] as const;
export type UIHorizontalAlignment = (typeof uiHorizontalAlignments)[number];

export const uiVerticalAlignments = ['top', 'center', 'bottom'] as const;
export type UIVerticalAlignment = (typeof uiVerticalAlignments)[number];
