type ArrayToDictionary = {
    <T>(array: T[], getKey: (item: T) => string | number, multiple?: false): { [key: string]: T };
    <T>(array: T[], getKey: (item: T) => string | number, multiple: true): { [key: string]: T[] };
};

/**
 * @param array Array to be converted to dictionary
 * @param getKey Function extracting string from an array item T, which will become its
 * key in the dictionary (if not unique, latter item could replace the former one)
 * @param multiple If true, dictionary values are arrays of all items with the given key
 * @returns Dictionary object with array items as values
 */
export const arrayToDictionary: ArrayToDictionary = <T>(
    array: T[],
    getKey: (item: T) => string | number,
    multiple?: boolean,
) =>
    multiple
        ? array.reduce<{ [key: string]: T[] }>(
              (prev, cur) => ({
                  ...prev,
                  [getKey(cur)]: [...(prev[getKey(cur)] ?? []), cur],
              }),
              {},
          )
        : array.reduce<{ [key: string]: T }>(
              (prev, cur) => ({
                  ...prev,
                  [getKey(cur)]: cur,
              }),
              {},
          );
