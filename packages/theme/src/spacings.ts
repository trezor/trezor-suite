export const spacings = {
    s: '8px',
    m: '16px',
    large: '24px',
    extraLarge: '32px',
} as const;

export type Spacings = typeof spacings;
export type Spacing = keyof typeof spacings;

export const nativeSpacings = {
    xs: 4,
    s: 8,
    m: 16,
    large: 24,
    extraLarge: 32,
    xxl: 64,
} as const;

export type NativeSpacings = typeof nativeSpacings;
export type NativeSpacing = keyof typeof nativeSpacings;
