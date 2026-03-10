/**
 * @deprecated Use numbers directly instead
 */
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
    xxxxxl: 60,
    xxxxxxl: 80,
} as const;

/**
 * @deprecated Use numbers directly instead
 */
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
    xxxxxl: -60,
    xxxxxxl: -80,
} as const;

export const spacingsNew = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 60, 80] as const;

export type SpacingValuesNew = (typeof spacingsNew)[number];
export type SpacingValuesPxNew = `${SpacingValuesNew}px`;

export type Spacings = typeof spacings;
export type Spacing = keyof Spacings;
export type NegativeSpacings = typeof negativeSpacings;
export type SpacingValues = Spacings[Spacing] | NegativeSpacings[Spacing];
export type SpacingPx = { [K in Spacing]: `${Spacings[K]}px` };
export type NegativeSpacingPx = { [K in Spacing]: `-${Spacings[K]}px` };
export type SpacingPxValues = SpacingPx[Spacing] | NegativeSpacingPx[Spacing];

export const spacingsPx = (Object.keys(spacings) as Array<Spacing>).reduce((result, key) => {
    (result as Record<Spacing, string>)[key] = `${spacings[key]}px`;

    return result;
}, {} as SpacingPx);

type NativeSpacingValue =
    | 1
    | 2
    | 4
    | 6
    | 8
    | 10
    | 12
    | 16
    | 18
    | 20
    | 24
    | 32
    | 36
    | 40
    | 48
    | 44
    | 52
    | 56
    | 64;

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
