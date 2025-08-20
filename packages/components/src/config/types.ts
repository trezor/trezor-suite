export const uiVariants = [
    'default',
    'primary',
    'secondary',
    'tertiary',
    'info',
    'warning',
    'destructive',
    'disabled',
] as const;
export type UIVariant = (typeof uiVariants)[number];

export const uiSizes = ['huge', 'large', 'medium', 'small', 'tiny'] as const;
export type UISize = (typeof uiSizes)[number];

export const uiAlignments = ['start', 'center', 'end'] as const;
export type UIAlignment = (typeof uiAlignments)[number];

export const uiIntent = ['brand', 'neutral', 'info', 'warning', 'critical'] as const;
export type UIIntent = (typeof uiIntent)[number];

export const uiPriority = ['primary', 'secondary'] as const;
export type UIPriority = (typeof uiPriority)[number];
