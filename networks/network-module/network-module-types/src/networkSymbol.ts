import type { Branded } from '@trezor/type-utils';

/**
 * Identifies a specific blockchain network across the registered modules, e.g. 'btc' for Bitcoin.
 * Mainnet and testnet have distinct symbols.
 *
 * Also identifies the network's native token: its built-in asset, such as BTC on Bitcoin or ETH
 * on Ethereum. The native token and the network are distinct concepts sharing this identifier.
 *
 * Deliberately open: callers outside the modules cannot know which networks the registered modules
 * handle, so any string may be branded. Each module narrows it to its own closed symbol type at
 * its boundary, in `createNetworkModule`.
 *
 * @see https://github.com/trezor/trezor-suite/blob/develop/docs/ubiquitous-language.md
 */
export type NetworkSymbol = string & Branded<'NetworkSymbol'>;

export const asNetworkSymbol = <TSymbol extends string>(
    networkSymbol: TSymbol,
): TSymbol & NetworkSymbol => networkSymbol as TSymbol & NetworkSymbol;

/** Brands a network module's supported-symbol list when it crosses into a shared layer. */
export const asNetworkSymbols = (networkSymbols: readonly string[]): readonly NetworkSymbol[] =>
    networkSymbols as readonly NetworkSymbol[];
