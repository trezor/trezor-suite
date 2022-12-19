type ArrayPartition = {
    <T, S extends T>(array: T[], condition: (elem: T) => elem is S): [S[], Exclude<T, S>[]];
    <T>(array: T[], condition: (elem: T) => boolean): [T[], T[]];
};

/**
 *
 * @param array Array to be divided into two parts.
 * @param condition Condition for inclusion in the first part.
 * @returns Array of two arrays - the items in the first array satisfy the condition and the rest is in the second array. Preserving original order.
 */
export const arrayPartition: ArrayPartition = <T>(array: T[], condition: (elem: T) => boolean) =>
    array.reduce<[T[], T[]]>(
        ([pass, fail], elem) =>
            condition(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]],
        [[], []],
    ) as any;
