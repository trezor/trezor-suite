import type { Branded } from '@trezor/type-utils';

/**
 * Addresses a network across the whole set of registered modules.
 *
 * Deliberately open: callers outside the modules cannot know which networks the registered modules
 * handle, so any string may be branded. Each module narrows it to its own closed symbol type at
 * its boundary, in `createNetworkModule`.
 */
export type NetworkSymbol = string & Branded<'NetworkSymbol'>;

export const asNetworkSymbol = <TSymbol extends string>(
    networkSymbol: TSymbol,
): TSymbol & NetworkSymbol => networkSymbol as TSymbol & NetworkSymbol;

/** Brands a network module's supported-symbol list when it crosses into a shared layer. */
export const asNetworkSymbols = (networkSymbols: readonly string[]): readonly NetworkSymbol[] =>
    networkSymbols as readonly NetworkSymbol[];
