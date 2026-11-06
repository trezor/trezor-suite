// Canonical list of supported coin symbols (lowercased coinInfo `shortcut`s), grouped by
// coinInfo category. Source of truth for the `CoinSymbol` type. The runtime guard
// (`getCoinInfo`, `enabledNetworksStore`) compares case-insensitively, so values are kept
// lowercase here. A drift test in @trezor/connect pins this to the @trezor/connect-data coin
// definitions — adding or removing a coin there without updating this list fails that test.
export const coinSymbols = [
    // UTXO coins, handled by the bitcoin methods (getAddress, getPublicKey, signTransaction, ...)
    'btc',
    'regtest',
    'test',
    'bch',
    'tbch',
    'doge',
    'elements',
    'ftc',
    'firo',
    'tfiro',
    'fjc',
    'grs',
    'tgrs',
    'kmd',
    'ltc',
    'tltc',
    'mona',
    'qtum',
    'tqtum',
    'rvn',
    'trvn',
    'sys',
    'xvg',
    'zec',
    'taz',
    // EVM coins
    'eth',
    'op',
    'avax',
    'bsc',
    'etc',
    'pol',
    'rhc',
    'hype',
    'base',
    'thod',
    'arb',
    'tsep',
    'arc',
    'tarc',
    // misc coins (cardano, solana, ripple, stellar, tron, monero, tezos, ...)
    'ada',
    'dsol',
    'nostr',
    'sol',
    'tada',
    'txrp',
    'xlm',
    'trx',
    'ttrx',
    'txlm',
    'xmr',
    'xrp',
    'xtz',
] as const;

// A supported coin symbol, e.g. `'btc'` / `'ada'`. See `coinSymbols`.
export type CoinSymbol = (typeof coinSymbols)[number];

export const asCoinSymbol = (value: string): CoinSymbol => value as CoinSymbol;

const coinSymbolSet: ReadonlySet<string> = new Set(coinSymbols);

// Runtime validation for `CoinSymbol`, derived from the same `coinSymbols` source as the type.
// Strict on the canonical lowercase form; callers accepting mixed case should lowercase first
// (the coin guard in @trezor/connect compares case-insensitively).
export const isCoinSymbol = (value: string): value is CoinSymbol => coinSymbolSet.has(value);
