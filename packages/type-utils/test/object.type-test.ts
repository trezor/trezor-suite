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

const y1ok: Y = { a: 'A', b: null };
const y2ok: Y = { a: 'A', b: { c: 'C', d: { e: null } } };

// @ts-expect-error This expects and error as a, b is missing
const y4fail: Y = {};

// @ts-expect-error This expects and error as b is missing
const y3fail: Y = { a: null };

void y1ok;
void y2ok;
void y4fail;
void y3fail;
