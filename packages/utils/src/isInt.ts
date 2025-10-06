/**
 * `Number.isInteger` doesn't work as TS guard, therefore we need this helper
 */
export function isInt(value: number | null): value is number {
    return Number.isInteger(value);
}
