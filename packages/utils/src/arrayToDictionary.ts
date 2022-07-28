/**
 * @param array Array to be converted to dictionary
 * @param getKey Function extracting string from an array item T, which will become its
 * key in the dictionary (if not unique, latter item could replace the former one)
 * @returns Dictionary object with array items as values
 */
export const arrayToDictionary = <T>(array: T[], getKey: (item: T) => string | number) =>
    array.reduce<{ [key: string]: T }>(
        (prev, cur) => ({
            ...prev,
            [getKey(cur)]: cur,
        }),
        {},
    );
