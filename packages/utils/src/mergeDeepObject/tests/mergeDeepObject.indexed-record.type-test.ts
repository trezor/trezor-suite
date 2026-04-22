import { mergeDeepObject } from '../mergeDeepObject';

const indexedBase: Record<string, { value: number }> = { foo: { value: 1 } };
const indexedOverride: Record<string, { value: number }> = { bar: { value: 2 } };

export const _testIndexedRecord: Record<string, { value: number }> = mergeDeepObject(
    indexedBase,
    indexedOverride,
);
