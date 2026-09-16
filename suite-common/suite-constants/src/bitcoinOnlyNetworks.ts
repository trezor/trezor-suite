import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

export const BITCOIN_ONLY_SYMBOLS = [
    asNetworkSymbol('btc'),
    asNetworkSymbol('test'),
    asNetworkSymbol('regtest'),
] as const satisfies NetworkSymbol[];

export type BitcoinOnlySymbolsItemType = (typeof BITCOIN_ONLY_SYMBOLS)[number];
