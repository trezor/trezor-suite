export const spacings = {
    zero: 0,
    xxxs: 2,
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    xxxxl: 48,
} as const;

type SpacingSize = keyof typeof spacings;

export const spacingsPx = (Object.keys(spacings) as Array<SpacingSize>).reduce(
    (result, key) => {
        (result as Record<SpacingSize, string>)[key] = `${spacings[key]}px`;

        return result;
    },
    {} as { [K in SpacingSize]: `${(typeof spacings)[K]}px` },
);

export type Spacings = typeof spacings;
export type Spacing = keyof typeof spacings;
export type SpacingValues = Spacings[Spacing];

type NativeSpacingValue = 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 52 | 64;

export const nativeSpacings = {
    sp2: 2,
    sp4: 4,
    sp8: 8,
    sp12: 12,
    sp16: 16,
    sp20: 20,
    sp24: 24,
    sp32: 32,
    sp40: 40,
    sp52: 52,
    sp64: 64,
} as const satisfies { [V in NativeSpacingValue as `sp${V}`]: V };

export type NativeSpacings = typeof nativeSpacings;
export type NativeSpacing = keyof typeof nativeSpacings;
