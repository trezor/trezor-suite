// Type-level regression test for the `isHex` overloads.
//
// `isHex(value, { prefix: 'required' })` must narrow `value` to `0x${string}`,
// exactly like the no-argument `isHex(value)` form (whose default prefix is
// already 'required'). It currently does NOT: `Extract<Options, { prefix:
// 'required' }>` in the first overload resolves to `never` (because `Options`
// is a single object type whose `prefix` is the wider union, not the literal
// 'required'), so the call falls through to the second overload and the type
// guard degrades to `value is string`.
//
// This file is part of `type-check` (tsc --build), so it fails to compile until
// the overload is fixed — see the PR description for the proposed fix.

import { isHex } from '../src/isHex';

const expectHexString = (_value: `0x${string}`) => {};
const expectString = (_value: string) => {};

declare const value: unknown;

// Default prefix is 'required' → narrows to `0x${string}`.
if (isHex(value)) {
    expectHexString(value);
}

// Explicit `{ prefix: 'required' }` is semantically identical and must narrow
// to `0x${string}` as well.
if (isHex(value, { prefix: 'required' })) {
    expectHexString(value);
}

// `{ prefix: 'required', allowEmpty: false }` must also keep the `0x${string}` guard.
if (isHex(value, { prefix: 'required', allowEmpty: false })) {
    expectHexString(value);
}

// 'optional' / 'prohibited' do not guarantee a 0x prefix → plain `string`.
if (isHex(value, { prefix: 'optional' })) {
    expectString(value);
    // @ts-expect-error 'optional' prefix must not narrow to `0x${string}`
    expectHexString(value);
}

if (isHex(value, { prefix: 'prohibited' })) {
    expectString(value);
    // @ts-expect-error 'prohibited' prefix must not narrow to `0x${string}`
    expectHexString(value);
}
