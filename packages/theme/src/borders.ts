export const borders = {
    widths: {
        small: '1px',
        medium: '1.5px',
        large: '2px',
    },
    radii: {
        badge: '10px',
        basic: '8px',
        round: '50%',
    },
} as const;

export type Borders = typeof borders;

export const nativeBorders = {
    widths: {
        s: 1,
        medium: 1.5,
        large: 2,
    },
    radii: {
        xs: 4,
        s: 8,
        medium: 16,
        large: 24,
        round: 100, // Equivalent to 50% on the web
    },
} as const;

export type NativeBorders = typeof nativeBorders;
