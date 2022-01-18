/**
 *
 * @param array Array to be divided into two parts.
 * @param condition Condition for inclusion in the first part.
 * @returns Array of two arrays - the items in the first array satisfy the condition and the rest is in the second array. Preserving original order.
 */
export const arrayPartition = <T = []>(array: T[], condition: (elem: T) => boolean): [T[], T[]] =>
    array.reduce(
        ([pass, fail], elem) =>
            condition(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]],
        [[], []] as [T[], T[]],
    );
