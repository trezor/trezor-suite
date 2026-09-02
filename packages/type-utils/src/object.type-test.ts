import type { NullablePropsRecursive, OptionalKey } from './index';

type X = {
    a: 'A';
    b: {
        c: 'C';
        d: {
            e: 'E';
        };
    };
};

type Y = NullablePropsRecursive<X>;

const y1ok: Y = { a: 'A', b: null };
const y2ok: Y = { a: 'A', b: { c: 'C', d: { e: null } } };

// @ts-expect-error This expects and error as a, b is missing
const y4fail: Y = {};

// @ts-expect-error This expects and error as b is missing
const y3fail: Y = { a: null };

type DiscriminatedUnion = { type: 'string'; value: string } | { type: 'number'; value: number };

type PartialDiscriminatedUnion = OptionalKey<DiscriminatedUnion, keyof DiscriminatedUnion>;

const nonDistributivePartial: PartialDiscriminatedUnion = {
    type: 'string',
    value: 1,
};

// @ts-expect-error The value remains constrained to the original property's value types.
const invalidNonDistributivePartial: PartialDiscriminatedUnion = { value: false };

void y1ok;
void y2ok;
void y3fail;
void y4fail;
void nonDistributivePartial;
void invalidNonDistributivePartial;
