import { Branded } from '@trezor/type-utils';

export type EvmAddress = `0x${string}` & Branded<'EvmAddress'>;
