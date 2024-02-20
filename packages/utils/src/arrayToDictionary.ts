type DictionaryKey = string | number;
type GetKey<T> = (item: T) => unknown;
type Key<Fn extends GetKey<any>, R = ReturnType<Fn>> = R extends DictionaryKey ? R : never;
type ArrayToDictionary = {
    <T, Fn extends GetKey<T>>(array: T[], getKey: Fn, multiple?: false): Record<Key<Fn>, T>;
    <T, Fn extends GetKey<T>>(array: T[], getKey: Fn, multiple: true): Record<Key<Fn>, T[]>;
};

/**
 * @param array Array to be converted to dictionary
 * @param getKey Function extracting string from an array item T, which will become its
 * key in the dictionary (if not unique, latter item could replace the former one)
 * Item will not be added to dictionary if key is not defined
 * @param multiple If true, dictionary values are arrays of all items with the given key
 * @returns Dictionary object with array items as values
 */

const validateKey = (key: unknown): key is DictionaryKey => {
    if (['string', 'number'].includes(typeof key)) {
        return true;
    }

    return false;
};

export const arrayToDictionary: ArrayToDictionary = <T, Fn extends GetKey<T>>(
    array: T[],
    getKey: Fn,
    multiple?: boolean,
) =>
    multiple
        ? array.reduce<Record<DictionaryKey, T[]>>((prev, cur) => {
              const key = getKey(cur);
              if (validateKey(key)) {
                  return {
                      ...prev,
                      [key]: [...(prev[key] ?? []), cur],
                  };
              }

              return prev;
          }, {})
        : array.reduce<Record<DictionaryKey, T>>((prev, cur) => {
              const key = getKey(cur);
              if (validateKey(key)) {
                  return {
                      ...prev,
                      [key]: cur,
                  };
              }

              return prev;
          }, {});
