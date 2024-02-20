export const spacings = {
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

export const nativeSpacings = {
    extraSmall: 4,
    small: 8,
    medium: 16,
    large: 24,
    extraLarge: 32,
    xxl: 64,
} as const;

export type NativeSpacings = typeof nativeSpacings;
export type NativeSpacing = keyof typeof nativeSpacings;
