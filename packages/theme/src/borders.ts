export const borderRadiusValues = [0, 4, 6, 8, 10, 12, 16, 20, 24, 32, 'full'] as const;
export type BorderRadius = (typeof borderRadiusValues)[number];

export const getBorderRadiusCssValue = (borderRadius: BorderRadius) =>
    borderRadius === 'full' ? 'calc(infinity * 1px)' : `${borderRadius}px`;

export const borderWidthValues = [1, 2, 4] as const;
export type BorderWidth = (typeof borderWidthValues)[number];

type NativeRadiusValue = 4 | 6 | 8 | 12 | 16 | 20 | 24;

export const nativeBorders = {
    widths: {
        small: 1,
        medium: 1.5,
        large: 2,
    },
    radii: {
        r4: 4,
        r6: 6,
        r8: 8,
        r12: 12,
        r16: 16,
        r20: 20,
        r24: 24,
        round: 100, // Equivalent to 50% on the web
    } satisfies { [V in NativeRadiusValue as `r${V}`]: V } & { round: 100 },
} as const;

export type NativeBorders = typeof nativeBorders;
export type NativeRadius = keyof typeof nativeBorders.radii;
