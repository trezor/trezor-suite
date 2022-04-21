// NOTE: `zIndex` values are defined as lower boundaries of a size 10 interval. For example,
// modals should have `zIndex` in interval [1040; 1050).

export const zIndices = {
    // TODO
    modal: 10000,
} as const;

export type ZIndex = keyof typeof zIndices;

export type ZIndices = typeof zIndices;
