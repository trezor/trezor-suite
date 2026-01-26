import { NullablePropsRecursive } from '../src';

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

export const y1ok: Y = { a: 'A', b: null };
export const y2ok: Y = { a: 'A', b: { c: 'C', d: { e: null } } };

// @ts-expect-error This expects and error as a, b is missing
export const y4fail: Y = {};

// @ts-expect-error This expects and error as b is missing
export const y3fail: Y = { a: null };
