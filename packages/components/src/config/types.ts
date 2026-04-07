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

export const uiIntents = [
    'brand',
    'neutral',
    'info',
    'warning',
    'critical',
    // TODO: Replace with intent-like label
    'accentViolet',
] as const;
export type UIIntent = (typeof uiIntents)[number];

export const uiPriorities = ['primary', 'secondary', 'tertiary'] as const;
export type UIPriority = (typeof uiPriorities)[number];
