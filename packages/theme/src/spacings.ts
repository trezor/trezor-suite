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

// TypeScript is lame and doesn't allow us to use `as const` with `Object.keys` so we have to cast it to `Spacing` manually
export const negativeSpacings = {
    zero: 0,
    xxxs: -2,
    xxs: -4,
    xs: -8,
    sm: -12,
    md: -16,
    lg: -20,
    xl: -24,
    xxl: -32,
    xxxl: -40,
    xxxxl: -48,
} as const;

export type Spacings = typeof spacings;
export type Spacing = keyof Spacings;
export type NegativeSpacings = typeof negativeSpacings;
export type SpacingValues = Spacings[Spacing] | NegativeSpacings[Spacing];
export type SpacingPx = { [K in Spacing]: `${Spacings[K]}px` };

export const spacingsPx = (Object.keys(spacings) as Array<Spacing>).reduce((result, key) => {
    (result as Record<Spacing, string>)[key] = `${spacings[key]}px`;

    return result;
}, {} as SpacingPx);

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
