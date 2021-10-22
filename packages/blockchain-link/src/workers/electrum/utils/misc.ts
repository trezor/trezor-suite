export const arrayToDic = <T>(array: T[], getKey: (item: T) => string) =>
    array.reduce<{ [key: string]: T }>(
        (prev, cur) => ({
            ...prev,
            [getKey(cur)]: cur,
        }),
        {}
    );

export const separate = <T>(dic: { [key: string]: T }, keys: string[]) =>
    keys.reduce(
        ([included, excluded], key) => {
            const { [key]: value, ...rest } = excluded;
            return typeof value !== 'undefined'
                ? [{ ...included, [key]: value }, rest]
                : [included, excluded];
        },
        [{}, dic]
    );

export const notUndefined = <T>(item?: T): item is T => typeof item !== 'undefined';

export const distinct = <T>(txid: T, index: number, self: T[]) => self.indexOf(txid) === index;

export const flatten = <T>(array: T[][]): T[] => ([] as T[]).concat(...array);

export const sum = (a: number, b: number) => a + b;

export const fail = (reason: string) => {
    throw new Error(reason);
};
