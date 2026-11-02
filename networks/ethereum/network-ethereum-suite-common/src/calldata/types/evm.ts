import { type Branded } from '@trezor/type-utils';

export type EvmAddress = `0x${string}` & Branded<'EvmAddress'>;
export const asEvmAddress = (address: string): EvmAddress => address as EvmAddress;
