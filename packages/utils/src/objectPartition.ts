type Obj<T> = { [key: string]: T };

/**
 *
 * @param obj Object to be divided into two parts.
 * @param keys Array of object keys for inclusion in the first object.
 * @returns Array of two objects - the first object has only keys from the array and the second the remaining keys
 */
export const objectPartition = <T>(obj: Obj<T>, keys: string[]): [Obj<T>, Obj<T>] =>
    keys.reduce(
        ([included, excluded], key) => {
            const { [key]: value, ...rest } = excluded;

            return typeof value !== 'undefined'
                ? [{ ...included, [key]: value }, rest]
                : [included, excluded];
        },
        [{}, obj],
    );
