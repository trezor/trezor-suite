export const spacings = {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
} as const;

export type Spacings = typeof spacings;
export type Spacing = keyof typeof spacings;

export const nativeSpacings: Record<Spacing, number> = {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

export type NativeSpacings = typeof nativeSpacings;
