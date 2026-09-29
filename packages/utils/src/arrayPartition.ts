/**
 *
 * @param array Array to be divided into two parts.
 * @param condition Condition for inclusion in the first part.
 * @returns Array of two arrays - the items in the first array satisfy the condition and the rest is in the second array. Preserving original order.
 */
export function arrayPartition<T, S extends T>(
    array: T[],
    condition: (elem: T) => elem is S,
): [S[], Exclude<T, S>[]];
export function arrayPartition<T>(array: T[], condition: (elem: T) => boolean): [T[], T[]];
export function arrayPartition<T>(array: T[], condition: (elem: T) => boolean): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];

    array.forEach(elem => {
        if (condition(elem)) {
            pass.push(elem);
        } else {
            fail.push(elem);
        }
    });

    return [pass, fail];
}
