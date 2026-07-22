import { type NetworkSymbol } from '@suite-common/wallet-config';

export const BITCOIN_ONLY_SYMBOLS = ['btc', 'test', 'regtest'] as const satisfies NetworkSymbol[];

export type BitcoinOnlySymbolsItemType = (typeof BITCOIN_ONLY_SYMBOLS)[number];
