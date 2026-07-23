import { type NetworkIconSymbol, legacyIconSymbols, networkSymbols } from './iconSymbols';
import { type NetworkIconName } from './networkIcons';

export const networkIconSymbolMap = {
    ada: 'ada',
    arb: 'arb',
    avax: 'avax',
    base: 'base',
    bch: 'bch',
    bsc: 'bsc',
    btc: 'btc',
    btg: 'btg',
    dash: 'dash',
    dgb: 'dgb',
    doge: 'doge',
    dsol: 'sol',
    etc: 'etc',
    eth: 'eth',
    ltc: 'ltc',
    nmc: 'nmc',
    op: 'op',
    pol: 'pol',
    regtest: 'btc',
    rhc: 'rhc',
    sol: 'sol',
    tada: 'ada',
    test: 'btc',
    thod: 'eth',
    trx: 'trx',
    ttrx: 'trx',
    tsep: 'eth',
    txlm: 'xlm',
    txrp: 'xrp',
    vtc: 'vtc',
    xlm: 'xlm',
    xmr: 'xmr',
    xrp: 'xrp',
    xtz: 'xtz',
    zec: 'zec',
} as const satisfies Record<NetworkIconSymbol, NetworkIconName>;

export const testnetNetworkIconSymbols = [
    'test',
    'regtest',
    'tada',
    'ttrx',
    'tsep',
    'thod',
    'txrp',
    'txlm',
    'dsol',
] as const satisfies readonly NetworkIconSymbol[];

export type TestnetNetworkIconSymbol = (typeof testnetNetworkIconSymbols)[number];

const testnetNetworkIconSymbolSet: ReadonlySet<NetworkIconSymbol> = new Set(
    testnetNetworkIconSymbols,
);

const cryptoIconSymbolSet: ReadonlySet<string> = new Set([...networkSymbols, ...legacyIconSymbols]);

export const getNetworkIconName = (networkSymbol: NetworkIconSymbol): NetworkIconName =>
    networkIconSymbolMap[networkSymbol];

export const isNetworkIconSymbol = (networkSymbol: string): networkSymbol is NetworkIconSymbol =>
    Object.hasOwn(networkIconSymbolMap, networkSymbol);

export const isTestnetNetworkIconSymbol = (
    networkSymbol: NetworkIconSymbol,
): networkSymbol is TestnetNetworkIconSymbol => testnetNetworkIconSymbolSet.has(networkSymbol);

/** Symbol has a bundled coin disc SVG (listed in the network icon map and present in cryptoIcons). */
export const isCryptoIconSymbol = (symbol: string): symbol is NetworkIconSymbol =>
    cryptoIconSymbolSet.has(symbol);
