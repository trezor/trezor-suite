export function roundTo(value: number, precision = 2) {
    const x = 10 ** precision;

    return Math.round(value * x) / x;
}
