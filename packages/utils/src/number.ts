export function roundTo(value: number, precision = 2) {
    const x = 10 ** precision;

    return Math.round(value * x) / x;
}

export const clamp = (
    value: number,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
) => Math.min(Math.max(value, min), max);
