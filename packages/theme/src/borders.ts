export const borders = {
    widths: {
        small: '1px',
        medium: '1.5px',
        large: '2px',
    },
    radii: {
        xxxs: '2px',
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        full: '100px',
    },
} as const;

export type Borders = typeof borders;

type NativeRadiusValue = 4 | 8 | 12 | 16 | 20 | 24;

export const nativeBorders = {
    widths: {
        small: 1,
        medium: 1.5,
        large: 2,
    },
    radii: {
        r4: 4,
        r8: 8,
        r12: 12,
        r16: 16,
        r20: 20,
        r24: 24,
        round: 100, // Equivalent to 50% on the web
    } satisfies { [V in NativeRadiusValue as `r${V}`]: V } & { round: 100 },
} as const;

export type NativeBorders = typeof nativeBorders;
