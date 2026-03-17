/**
 * Clamps a number between min and max bounds
 */
export const clamp = (
    value: number,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
) => Math.min(Math.max(value, min), max);
