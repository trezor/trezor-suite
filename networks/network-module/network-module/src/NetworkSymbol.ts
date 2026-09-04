import type { Branded } from '@trezor/type-utils';

export type NetworkSymbol = string & Branded<'NetworkSymbol'>;

export const asNetworkSymbol = (networkSymbol: string): NetworkSymbol =>
    networkSymbol as NetworkSymbol;

/** Brands a network module's supported-symbol list when it crosses into a shared layer. */
export const asNetworkSymbols = (networkSymbols: readonly string[]): readonly NetworkSymbol[] =>
    networkSymbols as unknown as readonly NetworkSymbol[];
