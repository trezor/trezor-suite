import type { Branded } from '@trezor/type-utils';

export type HexString = `0x${string}`;
export type IntegerString = `${bigint}`;
export type DecimalString = `${bigint}` | `${bigint}.${bigint}`;

export type Wei = Branded<'wei'>;
export type Gwei = Branded<'gwei'>;
export type Ether = Branded<'ether'>;
