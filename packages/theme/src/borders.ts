export const borders = {
    widths: {
        small: '1px',
        medium: '1.5px',
        large: '2px',
    },
    radii: {
        xs: '4px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        full: '100px',
    },
} as const;

export type Borders = typeof borders;

export const nativeBorders = {
    widths: {
        small: 1,
        medium: 1.5,
        large: 2,
    },
    radii: {
        extraSmall: 4,
        small: 8,
        medium: 16,
        large: 24,
        round: 100, // Equivalent to 50% on the web
    },
} as const;

export type NativeBorders = typeof nativeBorders;
