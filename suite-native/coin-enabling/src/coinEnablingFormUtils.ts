import { type NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';

export type EnabledCoins = Partial<Record<NetworkSymbol, boolean>>;

export type EnabledCoinFieldName = `enabledCoins.${NetworkSymbol}`;

export type CoinEnablingFormValues = {
    enabledCoins: EnabledCoins;
};

export const getEnabledCoinsFromNetworkSymbols = (symbols: NetworkSymbol[]): EnabledCoins =>
    symbols.reduce<EnabledCoins>(
        (enabledCoins, symbol) => ({
            ...enabledCoins,
            [symbol]: true,
        }),
        {},
    );

export const getEnabledCoinFieldName = (symbol: NetworkSymbol): EnabledCoinFieldName =>
    `enabledCoins.${symbol}`;

export const getNetworkSymbolsFromEnabledCoins = (enabledCoins: EnabledCoins): NetworkSymbol[] =>
    networkSymbolCollection.filter(symbol => enabledCoins[symbol]);
