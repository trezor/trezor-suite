import { mergeDeepObject } from '../mergeDeepObject';

type MergeTarget = {
    a: { b: { c: { d: boolean } } };
};

type MergeOverrides = {
    a?: { b?: { c?: { d?: boolean } } };
};

const baseState: MergeTarget = { a: { b: { c: { d: true } } } };
const overrides: MergeOverrides = { a: { b: { c: { d: false } } } };

export const _testDeepMerge: MergeTarget = mergeDeepObject(baseState, overrides);
