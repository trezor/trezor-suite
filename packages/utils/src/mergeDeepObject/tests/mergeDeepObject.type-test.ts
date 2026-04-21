import { mergeDeepObject } from '../mergeDeepObject';

type MergeTarget = {
    a: { b: { c: { d: boolean } } };
};

type MergeOverrides = {
    a?: { b?: { c?: { d?: boolean } } };
};

const baseState: MergeTarget = { a: { b: { c: { d: true } } } };
const overrides: MergeOverrides = { a: { b: { c: { d: false } } } };

export const _test: MergeTarget = mergeDeepObject(baseState, overrides);

const baseItems: { items: ['base'] } = { items: ['base'] };
const overrideItems: { items: ['override'] } = { items: ['override'] };
const indexedBase: Record<string, { value: number }> = { foo: { value: 1 } };
const indexedOverride: Record<string, { value: number }> = { bar: { value: 2 } };

export const _testMergeArraysFalse: {
    items: ['override'];
} = mergeDeepObject.withOptions({ mergeArrays: false }, baseItems, overrideItems);

export const _testIndexedRecord: Record<string, { value: number }> = mergeDeepObject(
    indexedBase,
    indexedOverride,
);

export const _testDotNotation: {
    settings: {
        feature: {
            enabled: boolean;
            label: string;
        };
    };
} = mergeDeepObject.withOptions(
    { dotNotation: true },
    { 'settings.feature.enabled': true },
    { settings: { feature: { label: 'enabled' } } },
);
