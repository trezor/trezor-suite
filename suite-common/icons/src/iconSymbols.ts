/** Networks supported in Trezor Suite with bundled network/coin icons. */
export const networkSymbols = [
    'ada',
    'arb',
    'avax',
    'base',
    'bch',
    'bsc',
    'btc',
    'doge',
    'dsol',
    'etc',
    'eth',
    'hype',
    'ltc',
    'op',
    'pol',
    'regtest',
    'rhc',
    'sol',
    'test',
    'thod',
    'trx',
    'ttrx',
    'tsep',
    'txlm',
    'txrp',
    'xlm',
    'xrp',
    'zec',
] as const;

export type NetworkSymbol = (typeof networkSymbols)[number];

/** Coins not supported in Suite, but available in Trezor Connect. */
export const legacyIconSymbols = [
    'btg',
    'dash',
    'dgb',
    'nmc',
    'tada',
    'vtc',
    'xmr',
    'xtz',
] as const;

export type LegacyNetworkSymbol = (typeof legacyIconSymbols)[number];

export type NetworkIconSymbol = NetworkSymbol | LegacyNetworkSymbol;
