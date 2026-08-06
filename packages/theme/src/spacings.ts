export const spacingValues = [
    0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96, 128, 160,
] as const;

export type SpacingValue = (typeof spacingValues)[number];

export type NegativeSpacingValue =
    | -2
    | -4
    | -6
    | -8
    | -10
    | -12
    | -14
    | -16
    | -20
    | -24
    | -28
    | -32
    | -40
    | -48
    | -64
    | -80
    | -96
    | -128
    | -160;
export type SignedSpacingValue = SpacingValue | NegativeSpacingValue;

type NativeSpacingValue =
    1 | 2 | 4 | 6 | 8 | 10 | 12 | 16 | 18 | 20 | 24 | 32 | 36 | 40 | 48 | 44 | 52 | 56 | 64;

export const nativeSpacings = {
    sp1: 1,
    sp2: 2,
    sp4: 4,
    sp6: 6,
    sp8: 8,
    sp12: 12,
    sp10: 10,
    sp16: 16,
    sp18: 18,
    sp20: 20,
    sp24: 24,
    sp32: 32,
    sp36: 36,
    sp40: 40,
    sp48: 48,
    sp44: 44,
    sp52: 52,
    sp56: 56,
    sp64: 64,
} as const satisfies { [V in NativeSpacingValue as `sp${V}`]: V };

export type NativeSpacings = typeof nativeSpacings;
export type NativeSpacing = keyof typeof nativeSpacings;
