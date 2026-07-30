import type { Branded, BrandedArity2 } from '@trezor/type-utils';

export type NetworkSymbol = string & Branded<'NetworkSymbol'>;

/** A network symbol refined only after its network configuration is verified as non-testnet. */
export type NetworkSymbolNonTestnet = NetworkSymbol & BrandedArity2<'NetworkSymbol', 'NonTestnet'>;

export const asNetworkSymbol = (networkSymbol: string): NetworkSymbol =>
    networkSymbol as NetworkSymbol;

export const asNetworkSymbols = (networkSymbols: readonly string[]): readonly NetworkSymbol[] =>
    networkSymbols as unknown as readonly NetworkSymbol[];
