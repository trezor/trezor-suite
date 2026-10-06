import { type NetworkSymbol } from '@suite-common/wallet-config';

// React Hook Form cannot resolve nested values through branded keys, so form keys use strings.
// Helpers still accept NetworkSymbol and filter selected symbols against supported networks.
export type EnabledCoins = Partial<Record<string, boolean>>;

export type EnabledCoinFieldName = `enabledCoins.${string}`;

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

export const getNetworkSymbolsFromEnabledCoins = (
    enabledCoins: EnabledCoins,
    supportedNetworks: readonly NetworkSymbol[],
): NetworkSymbol[] => supportedNetworks.filter(symbol => enabledCoins[symbol]);
