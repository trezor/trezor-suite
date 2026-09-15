export const BITCOIN_ONLY_SYMBOLS = ['btc', 'test', 'regtest'] as const;

export type BitcoinOnlySymbolsItemType = (typeof BITCOIN_ONLY_SYMBOLS)[number];
