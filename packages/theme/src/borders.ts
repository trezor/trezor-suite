export const borders = {
    widths: {
        sm: '1px',
        md: '1.5px',
        lg: '2px',
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
        sm: 1,
        md: 1.5,
        lg: 2,
    },
    radii: {
        basic: 5,
        round: '50%',
    },
} as const;

export type NativeBorders = typeof nativeBorders;
