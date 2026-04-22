import { mergeDeepObject } from '../mergeDeepObject';

const baseItems: { items: ['base'] } = { items: ['base'] };
const overrideItems: { items: ['override'] } = { items: ['override'] };

export const _testMergeArraysFalse: {
    items: ['override'];
} = mergeDeepObject.withOptions({ mergeArrays: false }, baseItems, overrideItems);
