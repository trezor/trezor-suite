export const EMPTY_INDEX_IDS: readonly never[] = [];
export const EMPTY_INDEX_ENTITIES: readonly never[] = [];
export const EMPTY_INDEX_ID_SET: ReadonlySet<never> = new Set<never>();

export const haveSameMembers = (left: readonly unknown[], right: readonly unknown[]) =>
    left.length === right.length && left.every((member, position) => member === right[position]);

const setsByIds = new WeakMap<readonly unknown[], ReadonlySet<unknown>>();

/** The set of an ids array, the same set for as long as it is the same array. */
export const toIdSet = <TId>(ids: readonly TId[]): ReadonlySet<TId> => {
    if (ids.length === 0) {
        return EMPTY_INDEX_ID_SET;
    }

    const known = setsByIds.get(ids);

    if (known !== undefined) {
        return known as ReadonlySet<TId>;
    }

    const set = new Set(ids);
    setsByIds.set(ids, set);

    return set;
};
