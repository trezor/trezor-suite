export const EMPTY_INDEX_IDS: readonly never[] = [];
export const EMPTY_INDEX_ENTITIES: readonly never[] = [];

export const haveSameMembers = (left: readonly unknown[], right: readonly unknown[]) =>
    left.length === right.length && left.every((member, position) => member === right[position]);
