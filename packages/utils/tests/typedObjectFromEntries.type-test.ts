import { typedObjectEntries, typedObjectFromEntries, typedObjectKeys } from '../src/typedObject';

const map = {
    a: 1,
    b: 2,
};

const _test: { [K in keyof typeof map]: number } = typedObjectFromEntries([
    ['a', 10],
    ['b', 20],
] as const);

const _test2: { [K in keyof typeof map]: number } = typedObjectFromEntries(
    typedObjectKeys(map).map(k => [k, map[k] * 2]),
);

const multiplyValues = <T extends Record<string, number>>(input: T) =>
    typedObjectFromEntries(typedObjectEntries(input).map(([key, value]) => [key, value * 2]));

const _test3: { [K in keyof typeof map]: number } = multiplyValues(map);

// @ts-expect-error String cannot be assigned to number as map-value
const _test4: { [K in keyof typeof map]: number } = typedObjectFromEntries(
    typedObjectKeys(map).map(k => [k, '']),
);

void _test;
void _test2;
void _test3;
void _test4;
