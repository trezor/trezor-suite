import { typedObjectFromEntries } from '../src/typedObjectFromEntries';
import { typedObjectKeys } from '../src/typedObjectKeys';

const map = {
    a: 1,
    b: 2,
};

export const _test: { [K in keyof typeof map]: number } = typedObjectFromEntries([
    ['a', 10],
    ['b', 20],
] as const);

export const _test2: { [K in keyof typeof map]: number } = typedObjectFromEntries(
    typedObjectKeys(map).map(k => [k, map[k] * 2]),
);

// @ts-expect-error String cannot be assigned to number as map-value
export const _test3: { [K in keyof typeof map]: number } = typedObjectFromEntries(
    typedObjectKeys(map).map(k => [k, '']),
);
